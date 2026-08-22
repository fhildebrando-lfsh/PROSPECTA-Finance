import Link from "next/link";
import { MetasSection } from "./MetasSection";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { monthRange } from "@/lib/finance/dates";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";
import { toAllocationEntry } from "@/lib/method/from-db";
import { hasFeature } from "@/lib/billing/entitlements";
import {
  bandForIncome,
  compareToBand,
  computeAllocation,
  percentOfIncome,
  type BandComparison,
} from "@/lib/method/allocation";

interface SearchParams {
  year?: string;
  month?: string; // 1-12
}

function monthQuery(year: number, monthIndex0: number) {
  return `?year=${year}&month=${monthIndex0 + 1}`;
}

const COMPARISON_LABEL: Record<BandComparison, string> = {
  abaixo: "abaixo da faixa",
  dentro: "dentro da faixa",
  acima: "acima da faixa",
};

const COMPARISON_COLOR: Record<BandComparison, string> = {
  abaixo: "text-amber-400",
  dentro: "text-emerald-400",
  acima: "text-amber-400",
};

export default async function ReguaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();

  // Etapa 3 do Método (2026-08-15) — Régua de Alocação é feature `regua_posicao`,
  // liberada a partir do plano Pro (§13.8). Primeira tela gateada por hasFeature().
  if (!(await hasFeature(workspaceId, "regua_posicao"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">A Régua de Alocação está disponível a partir do plano Pro.</p>
        <p className="mt-2">
          Ela mostra como sua receita do mês se distribuiu entre Essenciais, Estilo de vida, Obrigações e Poupança e
          Patrimônio, com uma faixa de referência calibrada pela sua própria receita.
        </p>
      </div>
    );
  }

  const params = await searchParams;

  const today = new Date();
  const year = params.year ? Number(params.year) : today.getUTCFullYear();
  const monthIndex0 = params.month ? Number(params.month) - 1 : today.getUTCMonth();
  const period = monthRange(year, monthIndex0);

  const dbEntries = await prisma.entry.findMany({
    where: { workspaceId },
    select: {
      id: true,
      nature: true,
      amount: true,
      transactionDate: true,
      dueDate: true,
      statusCode: true,
      macroBlocoOverride: true,
      category: { select: { slug: true } },
      subcategory: { select: { macroBloco: true } },
      wallet: { select: { kindCode: true } },
    },
  });

  const entries = dbEntries.map(toAllocationEntry);
  const totals = computeAllocation(entries, period, "settled");
  const pct = percentOfIncome(totals);
  const band = bandForIncome(totals.receita);

  const prevMonth = monthQuery(monthIndex0 === 0 ? year - 1 : year, monthIndex0 === 0 ? 11 : monthIndex0 - 1);
  const nextMonth = monthQuery(monthIndex0 === 11 ? year + 1 : year, monthIndex0 === 11 ? 0 : monthIndex0 + 1);

  const blocks = [
    { key: "essencial", label: "Essenciais", value: totals.essencial, percent: pct.essencial, target: band.essencial },
    {
      key: "estiloDeVida",
      label: "Estilo de vida",
      value: totals.estiloDeVida,
      percent: pct.estiloDeVida,
      target: band.estiloDeVida,
    },
    { key: "obrigacao", label: "Obrigações", value: totals.obrigacao, percent: pct.obrigacao, target: null },
    {
      key: "poupanca",
      label: "Poupança e Patrimônio",
      value: totals.poupanca,
      percent: pct.poupanca,
      target: band.poupanca,
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-zinc-500">
          Como sua receita do mês se distribuiu entre Essenciais, Estilo de vida, Obrigações e Poupança —{" "}
          {MONTH_LABELS[monthIndex0]}/{year}, só o realizado (liquidado). As faixas de referência são calibradas pela
          sua receita do período ({formatCurrencyBRL(totals.receita)}, faixa &ldquo;{band.label}&rdquo;) — são um ponto
          de partida, não uma regra fixa: cada família tem um custo de vida diferente.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={prevMonth} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
            ← mês anterior
          </Link>
          <Link href={nextMonth} className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800">
            mês seguinte →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {blocks.map((block) => {
          const comparison = block.target ? compareToBand(block.percent, block.target) : null;
          return (
            <div key={block.key} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
              <p className="text-xs text-indigo-300">{block.label}</p>
              <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(block.value)}</p>
              <p className="mt-1 font-mono text-sm tabular-nums text-zinc-400">{block.percent.toFixed(1)}% da receita</p>
              {block.target ? (
                <p className={`mt-1 text-xs ${COMPARISON_COLOR[comparison!]}`}>
                  {COMPARISON_LABEL[comparison!]} (referência {block.target[0]}–{block.target[1]}%)
                </p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">sem faixa-alvo — o ideal é 0%</p>
              )}
            </div>
          );
        })}
      </div>

      {(pct.naoClassificado > 0 || pct.naoAlocado > 0) && (
        <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400">
          {pct.naoClassificado > 0 && (
            <p>
              <span className="text-zinc-300">Não classificado:</span> {formatCurrencyBRL(totals.naoClassificado)} (
              {pct.naoClassificado.toFixed(1)}%) — despesas em subcategorias que ainda não têm um bloco definido.
            </p>
          )}
          {pct.naoAlocado > 0 && (
            <p>
              <span className="text-zinc-300">Não alocado:</span> {formatCurrencyBRL(
                totals.receita
                  .minus(totals.essencial)
                  .minus(totals.estiloDeVida)
                  .minus(totals.obrigacao)
                  .minus(totals.poupanca)
                  .minus(totals.naoClassificado),
              )}{" "}
              ({pct.naoAlocado.toFixed(1)}%) — receita que não virou despesa nem aporte neste período; pode ter ficado
              parada em conta.
            </p>
          )}
        </div>
      )}
    {/* Etapa 14 (§11.4) — a meta deste cliente, com prazo. A banda acima é a
        referência genérica da faixa de renda; esta é a trajetória combinada. */}
      <MetasSection
        workspaceId={workspaceId}
        actualPercent={{
          ESSENCIAL: pct.essencial,
          ESTILO_DE_VIDA: pct.estiloDeVida,
          OBRIGACAO: pct.obrigacao,
          POUPANCA: pct.poupanca,
        }}
      />

    </div>
  );
}
