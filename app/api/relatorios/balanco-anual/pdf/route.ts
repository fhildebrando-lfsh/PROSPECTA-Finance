import { type NextRequest } from "next/server";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { monthlySeries, periodTotals } from "@/lib/finance/period";
import { categoryMonthlyBreakdown } from "@/lib/finance/rankings";
import { type Regime } from "@/lib/finance/types";
import { buildBalancoAnualPdf, type BalancoAnualCategoryRow, type BalancoAnualPdfRow } from "@/lib/reports/pdf/balanco-anual";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const { searchParams } = new URL(request.url);

    const today = new Date();
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : today.getUTCFullYear();
    const regime: Regime = searchParams.get("regime") === "competencia" ? "competencia" : "caixa";

    const dbEntries = await prisma.entry.findMany({ where: { workspaceId }, include: { category: true } });
    const entries = dbEntries.map(toFinanceEntry);
    const categoryNameById = new Map(dbEntries.map((e) => [e.categoryId, e.category.name]));

    const series = monthlySeries(entries, year, 0, 12, regime);
    const yearPeriod = { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
    const yearTotals = periodTotals(entries, yearPeriod, regime);

    const syntheticRows: BalancoAnualPdfRow[] = [
      { label: "Receita", values: series.map((m) => m.totals.receita), total: yearTotals.receita },
      { label: "Despesa", values: series.map((m) => m.totals.despesa), total: yearTotals.despesa },
      { label: "Investimento", values: series.map((m) => m.totals.investimento), total: yearTotals.investimento },
      { label: "Saldo", values: series.map((m) => m.totals.balanco), total: yearTotals.balanco },
    ];

    const categoryRows: BalancoAnualCategoryRow[] = categoryMonthlyBreakdown(entries, year, regime).map((row) => ({
      categoryName: categoryNameById.get(row.categoryId) ?? "—",
      monthly: row.monthly,
      total: row.total,
    }));

    const regimeLabel = regime === "caixa" ? "caixa (Vence)" : "competência (Compra)";
    const pdf = await buildBalancoAnualPdf(year, regimeLabel, syntheticRows, categoryRows);
    return pdfResponse(pdf, `balanco-anual-${year}`);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
