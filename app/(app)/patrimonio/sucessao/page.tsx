import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { formatCurrencyBRL } from "@/lib/format";
import { Decimal } from "@/lib/finance/types";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { walletBalance } from "@/lib/finance/balance";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { investmentPositionValue } from "@/lib/finance/investment";
import { buildPatrimonyItems } from "@/lib/method/patrimony-function";
import {
  CHECKLIST_PCP,
  CUSTO_INVENTARIO_PADRAO_PCT,
  GROUP_LABELS,
  ITCMD_PADRAO_PCT,
  checklistProgress,
  successionLiquidityTest,
  type ChecklistGroup,
} from "@/lib/method/pcp";
import type { DeliverableContent } from "@/lib/method/deliverables/catalog";
import { GateAviso } from "@/components/method/GateAviso";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { salvarChecklistSucessorio } from "./actions";

const LIQUID_WALLET_KINDS = ["CONTA_BANCARIA", "CONTA_CAIXA", "CONTA_PAGAMENTO"];

interface Params {
  itcmd?: string;
  inventario?: string;
}

function n(raw: string | undefined, fallback: number): number {
  const v = Number(String(raw ?? "").replace(",", "."));
  return Number.isFinite(v) && String(raw ?? "").trim() !== "" ? v : fallback;
}

/**
 * Etapa 15 (§12.1) — Plano de Continuidade Patrimonial e teste de liquidez
 * sucessória.
 *
 * O teste é **derivado**, não perguntado: patrimônio, liquidez e capital de
 * seguro de vida já estão no sistema. Pedir de novo convidaria a divergência
 * entre o que o cliente digita aqui e o que ele cadastrou lá.
 *
 * O patrimônio usa `buildPatrimonyItems`, o mesmo da Etapa 7 — é a função que
 * corrige a dupla contagem entre carteira de investimento e posição hospedada
 * nela (Registro Nº 074). Somar tabelas separadas aqui reintroduziria o bug.
 */
export default async function SucessaoPage({ searchParams }: { searchParams: Promise<Params> }) {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "pcp_sucessorio"))) {
    return (
      <GateAviso
        workspaceId={workspaceId}
        titulo="O Plano de Continuidade Patrimonial faz parte da consultoria."
        explicacao="Ele verifica se, na hora da sucessão, existiria dinheiro para impostos e custas sem a família precisar vender bens com pressa — e acompanha o que ainda falta organizar."
      />
    );
  }

  const p = await searchParams;
  const itcmdPct = n(p.itcmd, ITCMD_PADRAO_PCT);
  const inventarioPct = n(p.inventario, CUSTO_INVENTARIO_PADRAO_PCT);

  const profile = await requireProfile();
  const engagement = await activeEngagement(workspaceId);

  const [assets, investments, wallets, entryRows, policies, pcps] = await Promise.all([
    prisma.asset.findMany({ where: { workspaceId, isActive: true } }),
    prisma.investment.findMany({ where: { workspaceId, isActive: true } }),
    prisma.wallet.findMany({
      where: { workspaceId, isActive: true, isPseudoWallet: false },
      include: { kind: { select: { isLiability: true } } },
    }),
    prisma.entry.findMany({
      where: { workspaceId },
      select: {
        id: true, walletId: true, categoryId: true, nature: true, amount: true,
        transactionDate: true, dueDate: true, statusCode: true, recurrenceCode: true,
        isFixedOverride: true, groupId: true, assetId: true, investmentId: true,
      },
    }),
    prisma.insurancePolicy.findMany({
      where: { workspaceId, isActive: true, kind: "VIDA" },
      include: { coverages: true },
    }),
    engagement
      ? prisma.deliverable.findMany({
          where: { engagementId: engagement.id, code: "PCP" },
          orderBy: { version: "desc" },
        })
      : Promise.resolve([]),
  ]);

  const financeEntries = entryRows.map(toFinanceEntry);
  const hoje = new Date();

  // Agrupa os lançamentos por origem — mesmo preparo de `run-assessment`.
  const assetEntriesById = new Map<string, typeof entryRows>();
  const investmentEntriesById = new Map<string, typeof entryRows>();
  for (const e of entryRows) {
    if (e.assetId) assetEntriesById.set(e.assetId, [...(assetEntriesById.get(e.assetId) ?? []), e]);
    if (e.investmentId)
      investmentEntriesById.set(e.investmentId, [...(investmentEntriesById.get(e.investmentId) ?? []), e]);
  }

  const itens = buildPatrimonyItems({
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      value: assetCurrentValue((assetEntriesById.get(a.id) ?? []) as unknown as AssetValuationEntry[]),
      funcao: a.funcaoPatrimonial,
    })),
    investments: investments.map((i) => ({
      id: i.id,
      name: i.name,
      walletId: i.walletId,
      value: investmentPositionValue((investmentEntriesById.get(i.id) ?? []) as never),
      funcao: i.funcaoPatrimonial,
    })),
    wallets: wallets
      .filter((w) => !w.kind.isLiability)
      .map((w) => ({
        id: w.id,
        name: w.name,
        balance: walletBalance(financeEntries, w.id, hoje),
        funcao: w.funcaoPatrimonial,
      })),
  });

  const patrimonioInventariavel = itens.reduce(
    (s, i) => (i.value.greaterThan(0) ? s.plus(i.value) : s),
    new Decimal(0),
  );

  const liquidezDisponivel = wallets
    .filter((w) => LIQUID_WALLET_KINDS.includes(w.kindCode))
    .reduce((s, w) => {
      const saldo = walletBalance(financeEntries, w.id, hoje);
      return saldo.greaterThan(0) ? s.plus(saldo) : s;
    }, new Decimal(0));

  const seguroDeVida = policies.reduce(
    (s, pol) => s.plus(pol.coverages.reduce((c, cov) => c.plus(cov.capitalInsured ?? 0), new Decimal(0))),
    new Decimal(0),
  );

  const teste = successionLiquidityTest(
    { patrimonioInventariavel, liquidezDisponivel, seguroDeVida },
    itcmdPct,
    inventarioPct,
  );

  const estado = ((pcps[0]?.content as unknown as DeliverableContent | undefined)?.checklist ?? {}) as Record<
    string,
    boolean
  >;
  const progresso = checklistProgress(estado);

  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  const podeProduzir =
    (membership?.role === "ADVISOR" && membership.advisorCanWrite) || profile.isPlatformAdmin;

  const grupos = [...new Set(CHECKLIST_PCP.map((i) => i.group))] as ChecklistGroup[];

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Sucessão tem custo e tem prazo. Este plano responde duas coisas: se existiria{" "}
        <strong className="text-zinc-400">dinheiro para impostos e custas</strong> sem a família precisar vender bens
        com pressa, e o que ainda falta organizar para que ninguém fique perdido.
      </p>

      <div
        className={`rounded-xl border p-6 ${
          teste.aprovado ? "border-emerald-900/50 bg-emerald-950/10" : "border-amber-700/60 bg-amber-950/20"
        }`}
      >
        <p className="text-xs text-indigo-300">Teste de liquidez sucessória</p>
        <p className={`mt-1 text-2xl ${teste.aprovado ? "text-emerald-300" : "text-amber-200"}`}>
          {teste.aprovado ? "Passa" : "Não passa"}
        </p>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">{teste.explicacao}</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Patrimônio inventariável" value={formatCurrencyBRL(patrimonioInventariavel)} hint="o que passa por inventário" />
          <Card label="Custo estimado" value={formatCurrencyBRL(teste.custoTotal)} hint={`ITCMD ${itcmdPct}% + custas ${inventarioPct}%`} />
          <Card label="Liquidez disponível" value={formatCurrencyBRL(liquidezDisponivel)} hint="contas e caixa" />
          <Card label="Seguro de vida" value={formatCurrencyBRL(seguroDeVida)} hint="não passa por inventário" />
        </div>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          ITCMD (%)
          <input name="itcmd" type="number" step="0.1" min="0" max="20" defaultValue={itcmdPct} className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Custas e honorários (%)
          <input name="inventario" type="number" step="0.1" min="0" max="30" defaultValue={inventarioPct} className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100" />
        </label>
        <button type="submit" className={BTN_PRIMARY}>
          Recalcular
        </button>
        <p className="w-full text-[11px] text-zinc-600">
          O ITCMD é estadual e varia de 2% a 8% — o padrão de {ITCMD_PADRAO_PCT}% é a alíquota de São Paulo, ponto de
          partida e não afirmação sobre o seu caso. Ajuste ao estado do cliente.
        </p>
      </form>

      <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-200">Checklist sucessório</h2>
          <p className="text-xs text-zinc-500">
            {progresso.concluidos} de {progresso.total} — {progresso.percentual.toFixed(0)}%
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-amber-500" style={{ width: `${progresso.percentual}%` }} />
        </div>

        <form action={salvarChecklistSucessorio} className="mt-4 flex flex-col gap-5">
          {grupos.map((g) => (
            <fieldset key={g}>
              <legend className="text-xs font-medium text-indigo-300">{GROUP_LABELS[g]}</legend>
              <div className="mt-2 flex flex-col gap-3">
                {CHECKLIST_PCP.filter((i) => i.group === g).map((item) => (
                  <label key={item.key} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name={`item_${item.key}`}
                      defaultChecked={estado[item.key] === true}
                      disabled={!podeProduzir}
                      className="mt-1 accent-amber-500"
                    />
                    <span>
                      <span className="text-zinc-200">{item.label}</span>
                      <span className="mt-0.5 block text-[11px] text-zinc-500">{item.porque}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {podeProduzir ? (
            <button type="submit" className={`${BTN_PRIMARY} self-start`}>
              Salvar checklist
            </button>
          ) : (
            <p className="text-xs text-zinc-500">
              Quem registra o plano de continuidade é o consultor responsável — o que está marcado aqui é o que ele
              já verificou.
            </p>
          )}
        </form>
      </section>

      <p className="max-w-3xl text-xs text-zinc-600">
        Este plano organiza e mede; ele não substitui advogado nem contador. Estrutura societária, testamento e
        doação em vida têm efeitos jurídicos e tributários que exigem profissional habilitado — a PROSPECTA aponta a
        lacuna e o custo, a decisão é conduzida com quem tem essa habilitação.
      </p>
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <p className="text-xs text-indigo-300">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-zinc-100">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}
