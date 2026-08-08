import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import {
  monthlyDebtCommitment,
  openInstallmentGroups,
  totalRemainingDebt,
  type InstallmentEntry,
} from "@/lib/finance/open-installments";
import { averageMonthlyExpense } from "@/lib/finance/reserve";
import { buildDividasPdf } from "@/lib/reports/pdf/dividas";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET() {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const today = new Date();

    const [installmentEntries, allEntries] = await Promise.all([
      prisma.entry.findMany({
        where: { workspaceId, nature: "DESPESA", installmentTotal: { not: null } },
        include: { category: true, wallet: true },
      }),
      prisma.entry.findMany({ where: { workspaceId } }),
    ]);

    const entries: InstallmentEntry[] = installmentEntries.map((e) => ({
      id: e.id,
      groupId: e.groupId,
      walletId: e.walletId,
      categoryId: e.categoryId,
      description: e.description,
      amount: e.amount,
      dueDate: e.dueDate,
      status: e.statusCode as InstallmentEntry["status"],
      installmentNumber: e.installmentNumber,
      installmentTotal: e.installmentTotal,
    }));

    const walletNameById = new Map(installmentEntries.map((e) => [e.walletId, e.wallet.name]));
    const categoryNameById = new Map(installmentEntries.map((e) => [e.categoryId, e.category.name]));
    const groups = openInstallmentGroups(entries).sort((a, b) => a.remainingAmount.comparedTo(b.remainingAmount));

    const totalDebt = totalRemainingDebt(groups);
    const monthlyCommitment = monthlyDebtCommitment(groups);
    const avgExpense = averageMonthlyExpense(allEntries.map(toFinanceEntry), today, 6);
    const commitmentPct = avgExpense.isZero() ? null : monthlyCommitment.abs().div(avgExpense.abs()).times(100);

    const pdf = await buildDividasPdf(totalDebt, monthlyCommitment, commitmentPct, groups, walletNameById, categoryNameById);
    return pdfResponse(pdf, "patrimonio-dividas");
  } catch (err) {
    return apiErrorResponse(err);
  }
}
