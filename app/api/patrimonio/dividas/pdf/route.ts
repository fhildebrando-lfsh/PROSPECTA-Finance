import { type NextRequest } from "next/server";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import {
  classifyDebtTerm,
  monthlyDebtCommitment,
  openInstallmentGroups,
  totalRemainingDebt,
  type DebtTerm,
  type InstallmentEntry,
} from "@/lib/finance/open-installments";
import { averageMonthlyExpense } from "@/lib/finance/reserve";
import { buildDividasPdf } from "@/lib/reports/pdf/dividas";
import { pdfResponse } from "@/lib/reports/pdf-response";

const PRAZO_LABELS: Record<DebtTerm, string> = {
  curto: "Curto prazo (até 12 meses)",
  longo: "Longo prazo (acima de 12 meses)",
};

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const today = new Date();
    const { searchParams } = new URL(request.url);
    const prazoParam = searchParams.get("prazo");
    const prazo: "todas" | DebtTerm = prazoParam === "curto" || prazoParam === "longo" ? prazoParam : "todas";

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
    const allGroups = openInstallmentGroups(entries).sort((a, b) => a.remainingAmount.comparedTo(b.remainingAmount));
    const groups = prazo === "todas" ? allGroups : allGroups.filter((g) => classifyDebtTerm(g, today) === prazo);

    const totalDebt = totalRemainingDebt(groups);
    const monthlyCommitment = monthlyDebtCommitment(groups);
    const avgExpense = averageMonthlyExpense(allEntries.map(toFinanceEntry), today, 6);
    const commitmentPct = avgExpense.isZero() ? null : monthlyCommitment.abs().div(avgExpense.abs()).times(100);

    const title = prazo === "todas" ? "Dívidas" : `Dívidas — ${PRAZO_LABELS[prazo]}`;
    const pdf = await buildDividasPdf(totalDebt, monthlyCommitment, commitmentPct, groups, walletNameById, categoryNameById, title);
    return pdfResponse(pdf, "patrimonio-dividas");
  } catch (err) {
    return apiErrorResponse(err);
  }
}
