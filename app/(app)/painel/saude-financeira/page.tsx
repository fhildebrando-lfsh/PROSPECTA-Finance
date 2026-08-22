import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { Decimal } from "@/lib/finance/types";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { averageMonthlyExpense, averageMonthlyIncome } from "@/lib/finance/reserve";
import { walletBalance } from "@/lib/finance/balance";
import { monthRange, addDays } from "@/lib/finance/dates";
import { isEntryIncident } from "@/lib/finance/incidents";
import { openInstallmentGroups, monthlyDebtCommitment, type InstallmentEntry } from "@/lib/finance/open-installments";
import { toAllocationEntry } from "@/lib/method/from-db";
import { computeAllocation, percentOfIncome, bandForIncome } from "@/lib/method/allocation";
import { computeConsistencyIndex, coberturaTemporal, qualidadeCategorizacao, filaDeIncidentes, coberturaDeCarteiras, conciliacao } from "@/lib/method/consistency";
import {
  organizacao,
  endividamento,
  liquidez,
  liquidezPorReservaRecomendada,
  protecao,
  protecaoCompleta,
  construcaoPatrimonial,
  longevidade,
  type PsfFaixa,
  type PsfIndicatorResult,
} from "@/lib/method/psf";
import { runAssessment } from "@/lib/method/mcrf/run-assessment";
import { latestReconciliationByWallet } from "@/lib/method/reconciliation";
import {
  FAIXA_ORDER,
  evolucaoFaixa,
  faixaDoSnapshot,
  faixaIndex,
} from "@/lib/method/psf-progress";
import { SaveSnapshotButton } from "./SaveSnapshotButton";
import { formatDateBR } from "@/lib/format";

/** Só as três kinds genuinamente líquidas/disponíveis na hora — mesmo espírito do critério já usado em `dashboardBalanceBlocks`, mas específico pro fôlego do PSF (exclui investimento, que exige resgate). */
const LIQUID_WALLET_KINDS = ["CONTA_BANCARIA", "CONTA_CAIXA", "CONTA_PAGAMENTO"];

const FAIXA_LABELS: Record<string, string> = {
  critico: "Crítico",
  fragil: "Frágil",
  em_construcao: "Em construção",
  saudavel: "Saudável",
  consolidado: "Consolidado",
};

const FAIXA_COLORS: Record<string, string> = {
  critico: "text-red-400",
  fragil: "text-amber-400",
  em_construcao: "text-amber-300",
  saudavel: "text-emerald-400",
  consolidado: "text-emerald-300",
};

/** Mesmas cores da faixa, como fundo — a barra e o rótulo têm de concordar. */
const FAIXA_BAR_COLORS: Record<string, string> = {
  critico: "bg-red-400",
  fragil: "bg-amber-400",
  em_construcao: "bg-amber-300",
  saudavel: "bg-emerald-400",
  consolidado: "bg-emerald-300",
};

export default async function SaudeFinanceiraPage() {
  const workspaceId = await requireWorkspaceId();

  // Etapa 5 do Método (2026-08-15) — PSF nível 1 (3 indicadores) é Pro; nível 2 (+2) é Max.
  const [nivel1, nivel2, temLongevidade] = await Promise.all([
    hasFeature(workspaceId, "psf_nivel_1"),
    hasFeature(workspaceId, "psf_nivel_2"),
    // §5.3.1 — Longevidade é indicador de **método**, e só existe depois que a
    // Etapa 13 passou a produzir `RetirementProjection`. Até 2026-08-18 ele
    // aparecia como "só com consultor ativo" sem ter de onde sair.
    hasFeature(workspaceId, "pla_projecao"),
  ]);

  if (!nivel1) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O Painel de Saúde Financeira está disponível a partir do plano Pro.</p>
        <p className="mt-2">
          Sete indicadores que traduzem sua situação financeira numa leitura visual e comparável ao longo do tempo —
          três já no Pro, mais dois no Max.
        </p>
      </div>
    );
  }

  const today = new Date();
  const [dbEntries, activeWallets, reconciliationByWallet, snapshots, projecaoBase] = await Promise.all([
    prisma.entry.findMany({
      where: { workspaceId },
      select: {
        id: true,
        walletId: true,
        categoryId: true,
        subcategoryId: true,
        nature: true,
        amount: true,
        transactionDate: true,
        dueDate: true,
        statusCode: true,
        recurrenceCode: true,
        isFixedOverride: true,
        groupId: true,
        installmentNumber: true,
        installmentTotal: true,
        incidentAcknowledgedAt: true,
        autoReviewReason: true,
        createdAt: true,
        macroBlocoOverride: true,
        category: { select: { slug: true } },
        subcategory: { select: { macroBloco: true } },
        wallet: { select: { kindCode: true } },
      },
    }),
    prisma.wallet.findMany({ where: { workspaceId, isActive: true }, select: { id: true, kindCode: true } }),
    latestReconciliationByWallet(workspaceId),
    prisma.healthSnapshot.findMany({ where: { workspaceId }, orderBy: { snapshotDate: "desc" }, take: 6 }),
    // Cenário **base** da versão mais recente: é o que o PLA apresenta como
    // referência. Usar o otimista inflaria a nota; o conservador a puniria.
    temLongevidade
      ? prisma.retirementProjection.findFirst({
          where: { workspaceId, scenario: "base" },
          orderBy: [{ version: "desc" }, { createdAt: "desc" }],
        })
      : Promise.resolve(null),
  ]);

  const financeEntries = dbEntries.map(toFinanceEntry);
  const allocationEntries = dbEntries.map(toAllocationEntry);
  const installmentEntries: InstallmentEntry[] = dbEntries.map((e) => ({
    id: e.id,
    groupId: e.groupId,
    walletId: e.walletId,
    categoryId: e.categoryId,
    description: "",
    amount: e.amount,
    dueDate: e.dueDate,
    status: e.statusCode as InstallmentEntry["status"],
    installmentNumber: e.installmentNumber,
    installmentTotal: e.installmentTotal,
  }));

  // Índice de Consistência (Etapa 2) — janela de 60 dias, mesmo horizonte da trava dura Fase 2→3 (§7.2).
  const consistencyPeriod = { start: addDays(today, -60), end: today };
  const activeWalletIds = activeWallets.map((w) => w.id);
  const openIncidents = dbEntries.filter(isEntryIncident);
  const consistency = computeConsistencyIndex({
    coberturaTemporal: coberturaTemporal(dbEntries, consistencyPeriod),
    qualidadeCategorizacao: qualidadeCategorizacao(dbEntries, consistencyPeriod),
    filaDeIncidentes: filaDeIncidentes(openIncidents, today),
    coberturaDeCarteiras: coberturaDeCarteiras(dbEntries, activeWalletIds, consistencyPeriod),
    conciliacao: conciliacao(
      [...reconciliationByWallet.values()].map((r) => ({
        walletId: r.walletId,
        declaredBalance: r.declaredBalance,
        systemBalance: r.systemBalance,
        checkedAt: r.checkedAt,
      })),
      activeWalletIds,
    ),
  });

  const avgIncome = averageMonthlyIncome(financeEntries, today);
  const avgExpense = averageMonthlyExpense(financeEntries, today);
  const debtCommitment = monthlyDebtCommitment(openInstallmentGroups(installmentEntries));

  const liquidBalance = activeWallets
    .filter((w) => LIQUID_WALLET_KINDS.includes(w.kindCode))
    .reduce((sum, w) => sum.plus(walletBalance(financeEntries, w.id, today)), new Decimal(0));

  const currentMonthPeriod = monthRange(today.getUTCFullYear(), today.getUTCMonth());
  const allocationTotals = computeAllocation(allocationEntries, currentMonthPeriod, "settled");
  const allocationPct = percentOfIncome(allocationTotals);
  const band = bandForIncome(allocationTotals.receita);

  /**
   * Etapa 9-A.7 — Liquidez e Proteção passam a consumir o MCRF quando ele
   * está disponível. A diferença é conceitual, não cosmética: o alvo deixa de
   * ser "6 meses de despesa para todo mundo" e passa a ser a **Reserva
   * Recomendada calculada para esta pessoa**, a partir dos riscos que de fato
   * a ameaçam.
   *
   * Fallback preservado: sem `reserva_inteligente`, os indicadores continuam
   * exatamente como estavam. Nenhum cliente perde indicador por causa disto.
   */
  const temMcrf = await hasFeature(workspaceId, "reserva_inteligente");
  const mcrf = temMcrf ? await runAssessment(workspaceId, today) : null;

  const liquidezResult =
    mcrf && mcrf.reserveTarget.greaterThan(0)
      ? liquidezPorReservaRecomendada(mcrf.eligibleReserve, mcrf.reserveTarget)
      : liquidez(liquidBalance, avgExpense);

  const indicators = {
    organizacao: organizacao(consistency.overall),
    endividamento: endividamento(debtCommitment, avgIncome),
    liquidez: liquidezResult,
    protecao: nivel2
      ? mcrf
        ? protecaoCompleta(
            liquidezResult.valor ?? 0,
            // Sem apólice cadastrada não há dado de cobertura — o peso volta
            // inteiro para a reserva em vez de virar nota ruim por omissão.
            mcrf.iprfComponentes.find((c) => c.nome === "Cobertura de seguros")?.valor === undefined
              ? null
              : (mcrf.iprfComponentes.find((c) => c.nome === "Cobertura de seguros")!.valor) * 100,
          )
        : protecao(liquidezResult.valor ?? 0)
      : null,
    construcao: nivel2 ? construcaoPatrimonial(allocationPct.poupanca, band.poupanca[0]) : null,
    // Sem projeção salva, `null` — "não avaliado", nunca faixa ruim: puniria o
    // cliente por um trabalho que o consultor ainda não fez.
    longevidade: temLongevidade
      ? longevidade(
          typeof (projecaoBase?.assumptions as { suficienciaPct?: unknown } | null)?.suficienciaPct === "number"
            ? ((projecaoBase!.assumptions as { suficienciaPct: number }).suficienciaPct)
            : null,
        )
      : null,
  };

  const cards: { key: string; label: string; result: PsfIndicatorResult | null; disponivel: boolean }[] = [
    { key: "organizacao", label: "Organização", result: indicators.organizacao, disponivel: true },
    { key: "endividamento", label: "Endividamento", result: indicators.endividamento, disponivel: true },
    { key: "liquidez", label: "Liquidez", result: indicators.liquidez, disponivel: true },
    { key: "protecao", label: "Proteção", result: indicators.protecao, disponivel: nivel2 },
    { key: "construcao", label: "Construção Patrimonial", result: indicators.construcao, disponivel: nivel2 },
    { key: "longevidade", label: "Longevidade", result: indicators.longevidade, disponivel: temLongevidade },
  ];

  // A foto mais recente é a régua da comparação. `snapshots` vem em ordem
  // decrescente, então [0] é a última salva — o "antes" do valor de agora.
  const fotoAnterior = snapshots[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-zinc-500">
          Indicador gerencial, não é nota de crédito nem diagnóstico clínico — compare-se só com você mesmo ao longo
          do tempo. Nível 1 (Organização, Endividamento, Liquidez) é Pro; nível 2 (Proteção, Construção Patrimonial)
          é Max. Longevidade e Continuidade só existem com um consultor ativo.
        </p>
        <SaveSnapshotButton indicators={indicators} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.key} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <p className="text-xs text-indigo-300">{card.label}</p>
            {!card.disponivel ? (
              <p className="mt-2 text-sm text-zinc-500">disponível no Max</p>
            ) : card.result?.faixa === null || card.result === null ? (
              <p className="mt-2 text-sm text-zinc-500">não avaliado</p>
            ) : (
              <>
                <p className={`font-mono text-xl tabular-nums ${FAIXA_COLORS[card.result.faixa]}`}>
                  {card.result.valor?.toFixed(0)}
                </p>
                <p className={`mt-1 text-xs ${FAIXA_COLORS[card.result.faixa]}`}>{FAIXA_LABELS[card.result.faixa]}</p>
                <FaixaBar faixa={card.result.faixa} />
                <MudancaDeNivelChip
                  evolucao={evolucaoFaixa(
                    fotoAnterior ? faixaDoSnapshot(fotoAnterior.indicators, card.key) : undefined,
                    card.result.faixa,
                  )}
                />
              </>
            )}
          </div>
        ))}
      </div>

      {snapshots.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Histórico</h2>
          <ul className="flex flex-col gap-1 text-xs text-zinc-500">
            {snapshots.map((s) => (
              <li key={s.id}>
                {formatDateBR(s.snapshotDate)} — {s.origin === "REVISADO" ? "revisado pelo consultor" : "automático"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Barra de cinco degraus — um por faixa do §8.3. Degraus discretos em vez de
 * uma barra contínua de propósito: a escala é **ordinal**, e uma barra lisa
 * sugeriria que a distância entre "frágil" e "em construção" é uma quantidade
 * comparável, que não é. Pela mesma razão o PSF usa faixas e não nota de 0 a 10.
 */
function FaixaBar({ faixa }: { faixa: PsfFaixa }) {
  const atual = faixaIndex(faixa) ?? 0;
  return (
    <div className="mt-3 flex gap-1" aria-label={`Nível ${atual + 1} de ${FAIXA_ORDER.length}`}>
      {FAIXA_ORDER.map((f, i) => (
        <span
          key={f}
          className={`h-1.5 flex-1 rounded-full ${i <= atual ? FAIXA_BAR_COLORS[faixa] : "bg-zinc-800"}`}
        />
      ))}
    </div>
  );
}

/**
 * Só aparece quando há comparação honesta: sem foto anterior, ou com indicador
 * não avaliado de um dos lados, `evolucaoFaixa` devolve null e nada é dito —
 * em vez de exibir "estável", que afirmaria algo que não se sabe.
 */
function MudancaDeNivelChip({ evolucao }: { evolucao: ReturnType<typeof evolucaoFaixa> }) {
  if (evolucao === null) return null;

  if (evolucao.mudanca === "igual") {
    return <p className="mt-2 text-[11px] text-zinc-600">mesmo nível da última foto</p>;
  }

  const subiu = evolucao.mudanca === "subiu";
  const degraus = evolucao.degraus === 1 ? "um nível" : `${evolucao.degraus} níveis`;
  return (
    <p className={`mt-2 text-[11px] ${subiu ? "text-emerald-400" : "text-amber-300"}`}>
      {subiu ? "↑" : "↓"} {subiu ? "subiu" : "caiu"} {degraus} desde a última foto
    </p>
  );
}
