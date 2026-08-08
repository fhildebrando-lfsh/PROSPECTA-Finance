import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { walletBalance } from "@/lib/finance/balance";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { goalProgress } from "@/lib/finance/goal";
import { buildMetasPdf, type MetasPdfRow } from "@/lib/reports/pdf/metas";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET() {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const today = new Date();

    const [goals, dbEntries] = await Promise.all([
      prisma.goal.findMany({ where: { workspaceId }, include: { wallet: true }, orderBy: { name: "asc" } }),
      prisma.entry.findMany({ where: { workspaceId } }),
    ]);
    const entries = dbEntries.map(toFinanceEntry);

    const rows: MetasPdfRow[] = goals.map((g) => {
      const balance = walletBalance(entries, g.walletId, today);
      return {
        name: g.name,
        walletName: g.wallet.name,
        balance,
        targetAmount: g.targetAmount,
        targetDate: g.targetDate,
        progress: goalProgress(balance, g.targetAmount),
        isActive: g.isActive,
      };
    });

    const pdf = await buildMetasPdf(rows);
    return pdfResponse(pdf, "patrimonio-metas");
  } catch (err) {
    return apiErrorResponse(err);
  }
}
