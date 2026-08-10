import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
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
import { buildInvestimentosPdf, type InvestimentosPdfRow } from "@/lib/reports/pdf/investimentos";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET() {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();

    const [investments, entries, investmentCategories] = await Promise.all([
      prisma.investment.findMany({ where: { workspaceId, isActive: true }, include: { class: true } }),
      prisma.entry.findMany({ where: { workspaceId, investmentId: { not: null } } }),
      prisma.category.findMany({ where: { nature: "INVESTIMENTO" } }),
    ]);

    const slugById = new Map(investmentCategories.map((c) => [c.id, c.slug]));
    const entriesByInvestment = new Map<string, typeof entries>();
    for (const e of entries) {
      if (!e.investmentId) continue;
      const list = entriesByInvestment.get(e.investmentId) ?? [];
      list.push(e);
      entriesByInvestment.set(e.investmentId, list);
    }

    const computed = investments.map((inv) => {
      const invEntries = entriesByInvestment.get(inv.id) ?? [];
      const position: InvestmentPositionEntry[] = invEntries
        .filter((e) => e.nature === "INVESTIMENTO")
        .map((e) => ({ amount: e.amount, categorySlug: slugById.get(e.categoryId) ?? "" }));
      const acquisitionValue = investmentAcquisitionValue(position);
      const currentValue = investmentPositionValue(position);
      const returnPct = investmentReturnPct(position);
      const incomeTotal = invEntries.filter((e) => e.nature === "RECEITA").reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
      return { inv, acquisitionValue, currentValue, gainLoss: investmentGainLoss(position), returnPct, incomeTotal };
    });

    const totalInvested = computed.reduce((sum, r) => sum.plus(r.acquisitionValue), new Decimal(0));
    const totalCurrent = computed.reduce((sum, r) => sum.plus(r.currentValue), new Decimal(0));
    const totalGainLoss = computed.reduce((sum, r) => sum.plus(r.gainLoss), new Decimal(0));
    const totalIncome = computed.reduce((sum, r) => sum.plus(r.incomeTotal), new Decimal(0));
    const consolidatedReturnPct = totalInvested.isZero() ? new Decimal(0) : totalGainLoss.div(totalInvested).times(100);

    const allocation = portfolioAllocation(
      computed.map((r) => ({ classCode: r.inv.classCode, classLabel: r.inv.class.labelPt, currentValue: r.currentValue })),
    ).sort((a, b) => b.value.comparedTo(a.value));

    const rows: InvestimentosPdfRow[] = [...computed]
      .sort((a, b) => b.returnPct.comparedTo(a.returnPct))
      .map((r) => ({
        name: r.inv.name,
        classLabel: r.inv.class.labelPt,
        acquisitionValue: r.acquisitionValue,
        currentValue: r.currentValue,
        returnPct: r.returnPct,
      }));

    const pdf = await buildInvestimentosPdf(totalInvested, totalCurrent, consolidatedReturnPct, totalIncome, allocation, rows);
    return pdfResponse(pdf, "investimentos");
  } catch (err) {
    return apiErrorResponse(err);
  }
}
