import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { createEntrySchema, parseIsoDate } from "@/lib/validation/entry";
import { generateInstallments } from "@/lib/finance/installments";
import { Decimal } from "@/lib/finance/types";
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

/** POST /api/entries — cria um lançamento único ou, com installmentsTotal, um parcelamento (§8.5). */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, role, isPlatformAdmin, profileId } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const body = await request.json();
    const input = createEntrySchema.parse(body);

    const amount = new Decimal(input.amount);
    const transactionDate = parseIsoDate(input.transactionDate);
    const dueDate = parseIsoDate(input.dueDate);

    const baseData = {
      workspaceId,
      walletId: input.walletId,
      categoryId: input.categoryId,
      subcategoryId: input.subcategoryId ?? null,
      responsibleId: input.responsibleId,
      nature: input.nature,
      description: input.description,
      statusCode: input.statusCode,
      recurrenceCode: input.recurrenceCode,
      note: input.note ?? null,
      tags: input.tags ?? [],
      isFixedOverride: input.isFixedOverride ?? null,
      createdBy: profileId,
      updatedBy: profileId,
    };

    if (input.installmentsTotal) {
      const group = await prisma.entryGroup.create({ data: { workspaceId } });
      const installments = generateInstallments({
        totalInstallments: input.installmentsTotal,
        firstDueDate: dueDate,
        transactionDate,
        amount,
        groupId: group.id,
      });

      const created = await prisma.$transaction(
        installments.map((inst) =>
          prisma.entry.create({
            data: {
              ...baseData,
              groupId: inst.groupId,
              transactionDate: inst.transactionDate,
              dueDate: inst.dueDate,
              amount: inst.amount,
              installmentNumber: inst.installmentNumber,
              installmentTotal: inst.installmentTotal,
            },
          }),
        ),
      );

      return NextResponse.json({ entries: created }, { status: 201 });
    }

    const entry = await prisma.entry.create({
      data: { ...baseData, transactionDate, dueDate, amount },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", details: err.issues }, { status: 400 });
    }
    return apiErrorResponse(err);
  }
}
