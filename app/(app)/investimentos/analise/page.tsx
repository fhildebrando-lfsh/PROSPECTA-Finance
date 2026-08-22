import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  investmentAcquisitionValue,
  investmentGainLoss,
  investmentPositionValue,
  investmentReturnPct,
  portfolioAllocation,
  type InvestmentPositionEntry,
} from "@/lib/finance/investment";
import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL } from "@/lib/format";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { PipSection } from "./PipSection";
import { MonthlyChart, type MonthlyChartPoint } from "@/components/charts/MonthlyChart";

const ALLOCATION_COLORS = ["#818cf8", "#34d399", "#fbbf24", "#f87171", "#38bdf8", "#c084fc", "#fb923c", "#4ade80", "#f472b6", "#a3e635"];

export default async function AnaliseInvestimentosPage() {
  const workspaceId = await requireWorkspaceId();

  const [investments, entries] = await Promise.all([
    prisma.investment.findMany({ where: { workspaceId, isActive: true }, include: { class: true } }),
    prisma.entry.findMany({ where: { workspaceId, investmentId: { not: null } } }),
  ]);

  const entriesByInvestment = new Map<string, typeof entries>();
  for (const e of entries) {
    if (!e.investmentId) continue;
    const list = entriesByInvestment.get(e.investmentId) ?? [];
    list.push(e);
    entriesByInvestment.set(e.investmentId, list);
  }

  // `investmentAcquisitionValue` precisa do slug "aportes" — as entries só trazem
  // `categoryId`, então busca o mapeamento categoryId → slug das categorias INVESTIMENTO
  // de uma vez (13 linhas, sem paginação).
  const investmentCategories = await prisma.category.findMany({ where: { nature: "INVESTIMENTO" } });
  const slugById = new Map(investmentCategories.map((c) => [c.id, c.slug]));

  const computed = investments.map((inv) => {
    const invEntries = entriesByInvestment.get(inv.id) ?? [];
    const position: InvestmentPositionEntry[] = invEntries
      .filter((e) => e.nature === "INVESTIMENTO")
      .map((e) => ({ amount: e.amount, categorySlug: slugById.get(e.categoryId) ?? "" }));
    const acquisitionValue = investmentAcquisitionValue(position);
    const currentValue = investmentPositionValue(position);
    const gainLoss = investmentGainLoss(position);
    const returnPct = investmentReturnPct(position);
    const incomeTotal = invEntries.filter((e) => e.nature === "RECEITA").reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
    return { inv, acquisitionValue, currentValue, gainLoss, returnPct, incomeTotal };
  });

  const totalInvested = computed.reduce((sum, r) => sum.plus(r.acquisitionValue), new Decimal(0));
  const totalCurrent = computed.reduce((sum, r) => sum.plus(r.currentValue), new Decimal(0));
  const totalGainLoss = computed.reduce((sum, r) => sum.plus(r.gainLoss), new Decimal(0));
  const totalIncome = computed.reduce((sum, r) => sum.plus(r.incomeTotal), new Decimal(0));
  const consolidatedReturnPct = totalInvested.isZero() ? new Decimal(0) : totalGainLoss.div(totalInvested).times(100);

  const allocation = portfolioAllocation(
    computed.map((r) => ({ classCode: r.inv.classCode, classLabel: r.inv.class.labelPt, currentValue: r.currentValue })),
  ).sort((a, b) => b.value.comparedTo(a.value));

  const ranking = [...computed].sort((a, b) => b.returnPct.comparedTo(a.returnPct));

  // Renda mensal recebida (todas as posições) — reaproveita MonthlyChart (receita/despesa/saldo),
  // aqui só a coluna "receita" faz sentido (despesa fica sempre 0, saldo = acumulado).
  const incomeEntries = entries.filter((e) => e.nature === "RECEITA");
  const monthlyIncome = new Map<string, Decimal>();
  for (const e of incomeEntries) {
    const key = `${e.transactionDate.getUTCFullYear()}-${String(e.transactionDate.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyIncome.set(key, (monthlyIncome.get(key) ?? new Decimal(0)).plus(e.amount));
  }
  const sortedMonths = Array.from(monthlyIncome.keys()).sort();
  let cumulativeIncome = new Decimal(0);
  const incomeChartData: MonthlyChartPoint[] = sortedMonths.map((key) => {
    const value = monthlyIncome.get(key)!;
    cumulativeIncome = cumulativeIncome.plus(value);
    const [year, month] = key.split("-");
    return { label: `${month}/${year.slice(2)}`, receita: value.toNumber(), despesa: 0, saldo: cumulativeIncome.toNumber() };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Visão consolidada de toda a carteira de investimentos — posição, alocação por classe e renda recebida ao
          longo do tempo.
        </p>
        <a href="/api/investimentos/pdf" className={BTN_PRIMARY}>
          Baixar PDF
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Total investido</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(totalInvested)}</p>
        </div>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Valor atual da carteira</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(totalCurrent)}</p>
        </div>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Rentabilidade consolidada</p>
          <p className={`font-mono text-xl tabular-nums ${consolidatedReturnPct.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
            {consolidatedReturnPct.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Renda total recebida</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(totalIncome)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Alocação por classe</h2>
        {allocation.length === 0 ? (
          <p className="text-xs text-zinc-500">Nenhum investimento ativo ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {allocation.map((a, i) => (
              <div key={a.classCode} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs text-indigo-200">{a.classLabel}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${a.percentage.toNumber()}%`, backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-400">{a.percentage.toFixed(0)}%</span>
                <span className="w-28 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-100">{formatCurrencyBRL(a.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {incomeChartData.length > 0 && (
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Renda recebida ao longo do tempo</h2>
          <MonthlyChart data={incomeChartData} />
        </div>
      )}

      {/* Etapa 14 — a política mora ao lado da carteira que ela governa. */}
      <PipSection
        workspaceId={workspaceId}
        positions={computed.map((r) => ({
          classCode: r.inv.classCode,
          classLabel: r.inv.class.labelPt,
          currentValue: r.currentValue,
        }))}
      />

      <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
              <th className="px-3 py-2 font-medium">Posição</th>
              <th className="px-3 py-2 font-medium">Classe</th>
              <th className="px-3 py-2 text-right font-medium">Investido</th>
              <th className="px-3 py-2 text-right font-medium">Valor atual</th>
              <th className="px-3 py-2 text-right font-medium">Rentabilidade</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => (
              <tr key={r.inv.id} className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/investimentos/${r.inv.id}`} className="hover:text-white hover:underline">
                    {r.inv.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-400">{r.inv.class.labelPt}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrencyBRL(r.acquisitionValue)}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">{formatCurrencyBRL(r.currentValue)}</td>
                <td className={`px-3 py-2 text-right font-mono tabular-nums ${r.returnPct.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
                  {r.returnPct.toFixed(1)}%
                </td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-xs text-zinc-500">
                  Nenhum investimento ativo ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
