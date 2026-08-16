import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { createEntrySchema, parseIsoDate } from "@/lib/validation/entry";
import { createEntryOrSeries } from "@/lib/entries/create";
import type { Prisma } from "@/app/generated/prisma/client";

/** GET /api/entries — lista filtrada por período/carteira/natureza/texto (§17). */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));

    const where: Prisma.EntryWhereInput = { workspaceId };

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from || to) {
      where.dueDate = {
        ...(from ? { gte: parseIsoDate(from) } : {}),
        ...(to ? { lte: parseIsoDate(to) } : {}),
      };
    }

    const walletId = searchParams.get("walletId");
    if (walletId) where.walletId = walletId;

    const nature = searchParams.get("nature");
    if (nature) where.nature = nature as Prisma.EnumEntryNatureFilter["equals"];

    const text = searchParams.get("q");
    if (text) where.description = { contains: text, mode: "insensitive" };

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: { wallet: true, category: true, subcategory: true, responsible: true },
        orderBy: { dueDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.entry.count({ where }),
    ]);

    return NextResponse.json({ entries, total, page, pageSize });
  } catch (err) {
    return apiErrorResponse(err);
  }
}

/**
 * POST /api/entries — cria um lançamento único, um parcelamento
 * (`installmentsTotal`, §8.5) ou, quando `recurrenceCode` é uma recorrência
 * sem fim (Mensal, Bimestral...), materializa 24 meses à frente (§8.5).
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, role, isPlatformAdmin, profileId, advisorCanWrite } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

    const body = await request.json();
    const input = createEntrySchema.parse(body);

    const entries = await createEntryOrSeries(workspaceId, profileId, input);

    return NextResponse.json(entries.length === 1 ? { entry: entries[0] } : { entries }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", details: err.issues }, { status: 400 });
    }
    return apiErrorResponse(err);
  }
}
