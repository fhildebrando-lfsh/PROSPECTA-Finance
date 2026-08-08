import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { parseIsoDate } from "@/lib/validation/entry";

async function requirePseudoWallet(workspaceId: string) {
  const wallet = await prisma.wallet.findFirst({ where: { workspaceId, isPseudoWallet: true } });
  if (!wallet) throw new ApiError(500, 'Carteira "Patrimônio" não encontrada neste workspace.');
  return wallet;
}

export interface CreateAssetInput {
  name: string;
  categoryId: string;
  responsibleId: string;
  acquisitionDate: string;
  /** String decimal positiva (§15 — nunca number/float no transporte). */
  acquisitionAmount: string;
  note?: string;
}

/**
 * Cria a ficha do bem e o primeiro lançamento ligado a ele (nature=OUTRO,
 * status=AQUISICAO, na carteira pseudo-conta "Patrimônio" já seedada — não é
 * escolhível pelo usuário, é sempre essa, ver §9/seed). Numa única transação:
 * um bem sem nenhum lançamento não deveria existir.
 */
export async function createAsset(workspaceId: string, profileId: string, input: CreateAssetInput) {
  const wallet = await requirePseudoWallet(workspaceId);
  const date = parseIsoDate(input.acquisitionDate);

  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: { workspaceId, categoryId: input.categoryId, name: input.name },
    });

    await tx.entry.create({
      data: {
        workspaceId,
        walletId: wallet.id,
        assetId: asset.id,
        nature: "OUTRO",
        categoryId: input.categoryId,
        description: input.name,
        responsibleId: input.responsibleId,
        amount: input.acquisitionAmount,
        recurrenceCode: "UNICA",
        statusCode: "AQUISICAO",
        transactionDate: date,
        dueDate: date,
        note: input.note ?? null,
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    return asset;
  });
}

export interface RegisterValuationInput {
  assetId: string;
  date: string;
  /** Com sinal — positivo (valorização) ou negativo (desvalorização), §8.3. */
  amount: string;
  responsibleId: string;
  note?: string;
}

/** Registra uma valorização/desvalorização — novo Entry ligado ao bem existente, status=ATUALIZACAO. */
export async function registerAssetValuation(workspaceId: string, profileId: string, input: RegisterValuationInput) {
  const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
  if (!asset || asset.workspaceId !== workspaceId) throw new ApiError(404, "Bem não encontrado.");

  const wallet = await requirePseudoWallet(workspaceId);
  const date = parseIsoDate(input.date);

  return prisma.entry.create({
    data: {
      workspaceId,
      walletId: wallet.id,
      assetId: asset.id,
      nature: "OUTRO",
      categoryId: asset.categoryId,
      description: asset.name,
      responsibleId: input.responsibleId,
      amount: input.amount,
      recurrenceCode: "UNICA",
      statusCode: "ATUALIZACAO",
      transactionDate: date,
      dueDate: date,
      note: input.note ?? null,
      createdBy: profileId,
      updatedBy: profileId,
    },
  });
}
