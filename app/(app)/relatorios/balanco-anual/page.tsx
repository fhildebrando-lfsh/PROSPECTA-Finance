import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { monthlySeries, periodTotals } from "@/lib/finance/period";
import { categoryMonthlyBreakdown } from "@/lib/finance/rankings";
import { type Regime } from "@/lib/finance/types";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";
import { MonthlyTotalsTable, type MonthlyTotalsRow } from "@/components/reports/MonthlyTotalsTable";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";

interface SearchParams {
  year?: string;
  regime?: Regime;
}

function reportQuery(year: number, regime: Regime) {
  return `?year=${year}&regime=${regime}`;
}

export default async function BalancoAnualPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();
  const params = await searchParams;

  const today = new Date();
  const year = params.year ? Number(params.year) : today.getUTCFullYear();
  const regime: Regime = params.regime === "competencia" ? "competencia" : "caixa";
  const otherRegime: Regime = regime === "caixa" ? "competencia" : "caixa";

  const dbEntries = await prisma.entry.findMany({ where: { workspaceId }, include: { category: true } });
  const entries = dbEntries.map(toFinanceEntry);
  const categoryNameById = new Map(dbEntries.map((e) => [e.categoryId, e.category.name]));

  const series = monthlySeries(entries, year, 0, 12, regime);
  const yearPeriod = { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
  const yearTotals = periodTotals(entries, yearPeriod, regime);

  const syntheticRows: MonthlyTotalsRow[] = [
    { label: "Receita", tone: "emerald", values: series.map((m) => m.totals.receita), total: yearTotals.receita },
    { label: "Despesa", tone: "red", values: series.map((m) => m.totals.despesa), total: yearTotals.despesa },
    {
      label: "Investimento",
      tone: "zinc",
      values: series.map((m) => m.totals.investimento),
      total: yearTotals.investimento,
    },
    { label: "Saldo", tone: "amber", values: series.map((m) => m.totals.balanco), total: yearTotals.balanco },
  ];

  const categoryRows = categoryMonthlyBreakdown(entries, year, regime);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Balanço anual {year} — sintético + descritivo por categoria, regime{" "}
          {regime === "caixa" ? "caixa (Vence)" : "competência (Compra)"}.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={reportQuery(year - 1, regime)}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            ← {year - 1}
          </Link>
          <Link
            href={reportQuery(year + 1, regime)}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            {year + 1} →
          </Link>
          <Link
            href={reportQuery(year, otherRegime)}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-zinc-300 hover:bg-zinc-800"
          >
            trocar p/ {otherRegime === "caixa" ? "caixa" : "competência"}
          </Link>
          <a href={`/api/relatorios/balanco-anual/pdf?year=${year}&regime=${regime}`} className={BTN_PRIMARY}>
            Baixar PDF
          </a>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Sintético</h2>
        <MonthlyTotalsTable rows={syntheticRows} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Descritivo por categoria (despesas)</h2>
        <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
                <th className="sticky left-0 bg-[#131A47] px-3 py-2 font-medium">Categoria</th>
                {MONTH_LABELS.map((label) => (
                  <th key={label} className="px-3 py-2 text-right font-medium">
                    {label}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map((row) => (
                <tr key={row.categoryId} className="border-b border-indigo-900/30 last:border-0">
                  <td className="sticky left-0 bg-[#131A47] px-3 py-2 text-indigo-100">
                    {categoryNameById.get(row.categoryId) ?? "—"}
                  </td>
                  {row.monthly.map((value, i) => (
                    <td key={i} className="px-3 py-2 text-right font-mono tabular-nums text-red-400">
                      {value.isZero() ? "—" : formatCurrencyBRL(value)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-red-400">
                    {formatCurrencyBRL(row.total)}
                  </td>
                </tr>
              ))}
              {categoryRows.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-3 py-4 text-center text-indigo-300">
                    Sem despesas no ano.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
