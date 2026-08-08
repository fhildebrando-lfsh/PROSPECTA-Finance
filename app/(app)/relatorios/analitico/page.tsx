import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { monthlySeries, periodTotals } from "@/lib/finance/period";
import { type Regime } from "@/lib/finance/types";
import { MonthlyTotalsTable, type MonthlyTotalsRow } from "@/components/reports/MonthlyTotalsTable";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";

interface SearchParams {
  year?: string;
  regime?: Regime;
}

function reportQuery(year: number, regime: Regime) {
  return `?year=${year}&regime=${regime}`;
}

export default async function AnaliticoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();
  const params = await searchParams;

  const today = new Date();
  const year = params.year ? Number(params.year) : today.getUTCFullYear();
  const regime: Regime = params.regime === "competencia" ? "competencia" : "caixa";
  const otherRegime: Regime = regime === "caixa" ? "competencia" : "caixa";

  const dbEntries = await prisma.entry.findMany({ where: { workspaceId } });
  const entries = dbEntries.map(toFinanceEntry);

  const series = monthlySeries(entries, year, 0, 12, regime);
  const yearPeriod = { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
  const yearTotals = periodTotals(entries, yearPeriod, regime);

  const rows: MonthlyTotalsRow[] = [
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Receita, despesa, investimento e saldo lado a lado, mês a mês — ano {year}, regime{" "}
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
          <a href={`/api/relatorios/analitico/pdf?year=${year}&regime=${regime}`} className={BTN_PRIMARY}>
            Baixar PDF
          </a>
        </div>
      </div>

      <MonthlyTotalsTable rows={rows} />
    </div>
  );
}
