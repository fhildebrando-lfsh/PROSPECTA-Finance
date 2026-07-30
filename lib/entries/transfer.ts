import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { createTransferPair } from "@/lib/finance/transfer";
import { Decimal } from "@/lib/finance/types";
import { parseIsoDate } from "@/lib/validation/entry";

export interface CreateTransferInput {
  fromWalletId: string;
  toWalletId: string;
  /** String decimal positiva (§15 — nunca number/float no transporte). */
  amount: string;
  date: string;
  responsibleId: string;
  subcategoryId?: string;
  description?: string;
}

/**
 * §10 R5 — cria as duas linhas de uma transferência atomicamente. Usa
 * `lib/finance/transfer.ts` para o par saída/entrada e resolve aqui os
 * campos que não são "puros" (categoria fixa "Transferências", carteiras,
 * responsável).
 */
export async function createTransfer(workspaceId: string, profileId: string, input: CreateTransferInput) {
  if (input.fromWalletId === input.toWalletId) {
    throw new ApiError(400, "Escolha carteiras diferentes para origem e destino.");
  }

  const category = await prisma.category.findUnique({
    where: { nature_slug: { nature: "OUTRO", slug: "transferencias" } },
  });
  if (!category) {
    throw new ApiError(500, 'Categoria "Transferências" não encontrada.');
  }

  const [fromWallet, toWallet] = await Promise.all([
    prisma.wallet.findUnique({ where: { id: input.fromWalletId } }),
    prisma.wallet.findUnique({ where: { id: input.toWalletId } }),
  ]);
  if (!fromWallet || fromWallet.workspaceId !== workspaceId) {
    throw new ApiError(404, "Carteira de origem não encontrada.");
  }
  if (!toWallet || toWallet.workspaceId !== workspaceId) {
    throw new ApiError(404, "Carteira de destino não encontrada.");
  }

  const date = parseIsoDate(input.date);
  const transferId = randomUUID();
  const [outLine, inLine] = createTransferPair({
    fromWalletId: input.fromWalletId,
    toWalletId: input.toWalletId,
    amount: new Decimal(input.amount),
    transferId,
    categoryId: category.id,
    transactionDate: date,
    dueDate: date,
  });

  const description = input.description?.trim() || `Transferência: ${fromWallet.name} → ${toWallet.name}`;

  const baseData = {
    workspaceId,
    subcategoryId: input.subcategoryId ?? null,
    description,
    responsibleId: input.responsibleId,
    recurrenceCode: "UNICA",
    statusCode: "PAGO",
    createdBy: profileId,
    updatedBy: profileId,
  };

  return prisma.$transaction([
    prisma.entry.create({
      data: {
        ...baseData,
        walletId: outLine.walletId,
        nature: outLine.nature,
        categoryId: outLine.categoryId,
        amount: outLine.amount,
        transferId: outLine.transferId,
        transactionDate: outLine.transactionDate,
        dueDate: outLine.dueDate,
      },
    }),
    prisma.entry.create({
      data: {
        ...baseData,
        walletId: inLine.walletId,
        nature: inLine.nature,
        categoryId: inLine.categoryId,
        amount: inLine.amount,
        transferId: inLine.transferId,
        transactionDate: inLine.transactionDate,
        dueDate: inLine.dueDate,
      },
    }),
  ]);
}
