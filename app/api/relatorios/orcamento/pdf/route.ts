import { type NextRequest } from "next/server";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { monthRange } from "@/lib/finance/dates";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { categoryDistribution } from "@/lib/finance/rankings";
import { type Regime } from "@/lib/finance/types";
import { buildOrcamentoPdf, type OrcamentoPdfRow } from "@/lib/reports/pdf/orcamento";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const { searchParams } = new URL(request.url);

    const today = new Date();
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : today.getUTCFullYear();
    const monthIndex0 = searchParams.get("month") ? Number(searchParams.get("month")) - 1 : today.getUTCMonth();
    const regime: Regime = searchParams.get("regime") === "competencia" ? "competencia" : "caixa";

    const [categories, budgets, dbEntries] = await Promise.all([
      prisma.category.findMany({ where: { nature: "DESPESA" }, orderBy: { sortOrder: "asc" } }),
      prisma.budget.findMany({ where: { workspaceId, year, month: monthIndex0 + 1 } }),
      prisma.entry.findMany({ where: { workspaceId } }),
    ]);

    const entries = dbEntries.map(toFinanceEntry);
    const period = monthRange(year, monthIndex0);
    const realizedByCategory = new Map(categoryDistribution(entries, period, regime).map((r) => [r.categoryId, r.total.toNumber()]));
    const plannedByCategory = new Map(budgets.map((b) => [b.categoryId, b.plannedAmount.toNumber()]));

    const rows: OrcamentoPdfRow[] = categories.map((c) => ({
      categoryName: c.name,
      planned: plannedByCategory.get(c.id) ?? 0,
      realized: realizedByCategory.get(c.id) ?? 0,
    }));

    const regimeLabel = regime === "caixa" ? "caixa (Vence)" : "competência (Compra)";
    const pdf = await buildOrcamentoPdf(year, monthIndex0, regimeLabel, rows);
    return pdfResponse(pdf, `orcamento-${year}-${monthIndex0 + 1}`);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
