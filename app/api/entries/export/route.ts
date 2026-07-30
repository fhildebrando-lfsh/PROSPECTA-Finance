import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { buildCsv } from "@/lib/entries/build-csv";
import { buildXlsx } from "@/lib/entries/build-xlsx";
import { toExportRow } from "@/lib/entries/export-row";
import type { Prisma } from "@/app/generated/prisma/client";

/**
 * GET /api/entries/export — §18.2. Respeita os mesmos filtros da tela de
 * Lançamentos e registra em export_logs (exportação é a principal via de
 * vazamento de dados financeiros).
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId, profileId } = await requireApiWorkspaceMembership();
    const { searchParams } = new URL(request.url);

    const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

    const where: Prisma.EntryWhereInput = { workspaceId };
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from || to) {
      where.dueDate = {
        ...(from ? { gte: new Date(`${from}T00:00:00Z`) } : {}),
        ...(to ? { lte: new Date(`${to}T00:00:00Z`) } : {}),
      };
    }
    const walletId = searchParams.get("walletId");
    if (walletId) where.walletId = walletId;
    const nature = searchParams.get("nature");
    if (nature) where.nature = nature as Prisma.EnumEntryNatureFilter["equals"];
    const q = searchParams.get("q");
    if (q) where.description = { contains: q, mode: "insensitive" };

    const [entries, natureLabels] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: { wallet: true, category: true, subcategory: true, responsible: true, status: true, recurrence: true },
        orderBy: { dueDate: "desc" },
      }),
      prisma.natureLabel.findMany(),
    ]);

    if (entries.length === 0) throw new ApiError(400, "Nenhum lançamento para exportar com esses filtros.");

    const natureLabelByCode = new Map(natureLabels.map((n) => [n.code, n.labelPt]));
    const rows = entries.map((e) => toExportRow(e, natureLabelByCode));

    const filterSummary = [
      from ? `de ${from}` : null,
      to ? `até ${to}` : null,
      walletId ? `carteira ${walletId}` : null,
      nature ? `tipo ${nature}` : null,
      q ? `busca "${q}"` : null,
    ]
      .filter(Boolean)
      .join(", ") || "sem filtro";

    await prisma.exportLog.create({
      data: { workspaceId, profileId, format, filters: filterSummary, rowCount: rows.length },
    });

    if (format === "xlsx") {
      const buffer = await buildXlsx(rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="lancamentos.xlsx"`,
        },
      });
    }

    const csv = buildCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lancamentos.csv"`,
      },
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
