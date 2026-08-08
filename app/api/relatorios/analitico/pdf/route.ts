import { type NextRequest } from "next/server";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { monthlySeries, periodTotals } from "@/lib/finance/period";
import { type Regime } from "@/lib/finance/types";
import { buildAnaliticoPdf, type AnaliticoPdfRow } from "@/lib/reports/pdf/analitico";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const { searchParams } = new URL(request.url);

    const today = new Date();
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : today.getUTCFullYear();
    const regime: Regime = searchParams.get("regime") === "competencia" ? "competencia" : "caixa";

    const dbEntries = await prisma.entry.findMany({ where: { workspaceId } });
    const entries = dbEntries.map(toFinanceEntry);

    const series = monthlySeries(entries, year, 0, 12, regime);
    const yearPeriod = { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
    const yearTotals = periodTotals(entries, yearPeriod, regime);

    const rows: AnaliticoPdfRow[] = [
      { label: "Receita", values: series.map((m) => m.totals.receita), total: yearTotals.receita },
      { label: "Despesa", values: series.map((m) => m.totals.despesa), total: yearTotals.despesa },
      { label: "Investimento", values: series.map((m) => m.totals.investimento), total: yearTotals.investimento },
      { label: "Saldo", values: series.map((m) => m.totals.balanco), total: yearTotals.balanco },
    ];

    const regimeLabel = regime === "caixa" ? "caixa (Vence)" : "competência (Compra)";
    const pdf = await buildAnaliticoPdf(year, regimeLabel, rows);
    return pdfResponse(pdf, `analitico-${year}`);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
