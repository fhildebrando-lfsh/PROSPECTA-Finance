import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { Decimal } from "@/lib/finance/types";
import { buildBensPdf, type BensPdfRow } from "@/lib/reports/pdf/bens";
import { pdfResponse } from "@/lib/reports/pdf-response";

export async function GET() {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();

    const [assets, linkedEntries] = await Promise.all([
      prisma.asset.findMany({ where: { workspaceId }, include: { category: true }, orderBy: { name: "asc" } }),
      prisma.entry.findMany({
        where: { workspaceId, assetId: { not: null } },
        select: { id: true, assetId: true, amount: true, statusCode: true },
      }),
    ]);

    const entriesByAsset = new Map<string, AssetValuationEntry[]>();
    for (const e of linkedEntries) {
      const list = entriesByAsset.get(e.assetId!) ?? [];
      list.push({ id: e.id, assetId: e.assetId, amount: e.amount, status: e.statusCode as AssetValuationEntry["status"] });
      entriesByAsset.set(e.assetId!, list);
    }

    const rows: BensPdfRow[] = assets.map((a) => ({
      name: a.name,
      categoryName: a.category.name,
      currentValue: assetCurrentValue(entriesByAsset.get(a.id) ?? []),
      isActive: a.isActive,
    }));

    const totalPatrimony = rows.filter((r) => r.isActive).reduce((sum, r) => sum.plus(r.currentValue), new Decimal(0));

    const pdf = await buildBensPdf(totalPatrimony, rows);
    return pdfResponse(pdf, "patrimonio-bens");
  } catch (err) {
    return apiErrorResponse(err);
  }
}
