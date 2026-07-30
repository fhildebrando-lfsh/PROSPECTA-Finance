import { prisma } from "@/lib/db/prisma";
import { generateInstallments, generateRecurrenceOccurrences } from "@/lib/finance/installments";
import { Decimal } from "@/lib/finance/types";
import type { CreateEntryInput } from "@/lib/validation/entry";
import { parseIsoDate } from "@/lib/validation/entry";

/**
 * Cria um lançamento — único, parcelado (§8.5, `installmentsTotal`) ou
 * recorrente sem fim (§8.5, materializa 24 meses quando `recurrenceCode`
 * não é UNICA/VARIAVEL). Usado tanto pela API (`/api/entries`) quanto pela
 * tela de lançamento rápido (§12), pra não duplicar a lógica de criação.
 */
export async function createEntryOrSeries(
  workspaceId: string,
  profileId: string,
  input: CreateEntryInput,
) {
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

    return prisma.$transaction(
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
  }

  const NON_RECURRING = new Set(["UNICA", "VARIAVEL"]);
  if (!NON_RECURRING.has(input.recurrenceCode)) {
    const recurrenceKind = await prisma.recurrenceKind.findUniqueOrThrow({
      where: { code: input.recurrenceCode },
    });

    const group = await prisma.entryGroup.create({ data: { workspaceId } });
    const occurrences = generateRecurrenceOccurrences({
      firstDueDate: dueDate,
      transactionDate,
      amount,
      groupId: group.id,
      intervalMonths: recurrenceKind.intervalMonths,
    });

    return prisma.$transaction(
      occurrences.map((occ) =>
        prisma.entry.create({
          data: {
            ...baseData,
            groupId: occ.groupId,
            transactionDate: occ.transactionDate,
            dueDate: occ.dueDate,
            amount: occ.amount,
          },
        }),
      ),
    );
  }

  return [
    await prisma.entry.create({
      data: { ...baseData, transactionDate, dueDate, amount },
    }),
  ];
}
