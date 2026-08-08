import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { openInstallmentGroups, type InstallmentEntry } from "@/lib/finance/open-installments";
import { buildParceladasPdf } from "@/lib/reports/pdf/parceladas";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET() {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();

    const dbEntries = await prisma.entry.findMany({
      where: { workspaceId, installmentTotal: { not: null } },
      include: { category: true, wallet: true },
    });

    const entries: InstallmentEntry[] = dbEntries.map((e) => ({
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

    const walletNameById = new Map(dbEntries.map((e) => [e.walletId, e.wallet.name]));
    const categoryNameById = new Map(dbEntries.map((e) => [e.categoryId, e.category.name]));
    const groups = openInstallmentGroups(entries);

    const pdf = await buildParceladasPdf(groups, walletNameById, categoryNameById);
    return pdfResponse(pdf, "despesas-parceladas");
  } catch (err) {
    return apiErrorResponse(err);
  }
}
