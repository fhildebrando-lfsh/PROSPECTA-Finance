import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { CardConfig } from "@/lib/finance/card";
import { suggestCategoriesByDescription } from "../suggest-category-bulk";
import { installmentKey, PDF_ROW_HEADERS, pdfTransactionsToRows } from "./pdf-to-rows";
import type { PdfStatementTransaction } from "./types";

export interface PdfImportParams {
  walletId: string;
  responsibleId: string;
  fallbackCategoryDespesaId: string;
  fallbackCategoryReceitaId: string;
}

export interface PdfImportResult {
  headers: string[];
  records: Record<string, string>[];
  skippedDuplicateInstallments: number;
}

/**
 * Resolve uma importação de fatura de cartão em PDF inteira (carteira/responsável/
 * categorias padrão escolhidos uma vez pro arquivo inteiro, mesma ideia de
 * `buildOfxImportRows`) — exige que a carteira seja um cartão de crédito configurado
 * (fatura em PDF não faz sentido para conta bancária) e resolve as parcelas já
 * lançadas antes de chamar a síntese pura das linhas (`pdfTransactionsToRows`).
 */
export async function buildPdfImportRows(
  workspaceId: string,
  transactions: PdfStatementTransaction[],
  params: PdfImportParams,
): Promise<PdfImportResult> {
  const [wallet, responsible, fallbackDespesa, fallbackReceita] = await Promise.all([
    prisma.wallet.findFirst({ where: { id: params.walletId, workspaceId } }),
    prisma.person.findFirst({ where: { id: params.responsibleId, workspaceId } }),
    prisma.category.findUnique({ where: { id: params.fallbackCategoryDespesaId } }),
    prisma.category.findUnique({ where: { id: params.fallbackCategoryReceitaId } }),
  ]);

  if (!wallet) throw new ApiError(400, "Carteira inválida.");
  if (!responsible) throw new ApiError(400, "Responsável inválido.");
  if (!fallbackDespesa || fallbackDespesa.nature !== "DESPESA") {
    throw new ApiError(400, "Categoria padrão de despesas inválida.");
  }
  if (!fallbackReceita || fallbackReceita.nature !== "RECEITA") {
    throw new ApiError(400, "Categoria padrão de receitas inválida.");
  }
  if (wallet.kindCode !== "CARTAO_CREDITO" || !wallet.closingDay || !wallet.dueDay) {
    throw new ApiError(
      400,
      "Importação de fatura em PDF só vale para carteiras de cartão de crédito com dia de fechamento e vencimento configurados.",
    );
  }
  const cardConfig: CardConfig = { closingDay: wallet.closingDay, dueDay: wallet.dueDay };

  const categorySuggestions = await suggestCategoriesByDescription(workspaceId);
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const existingInstallments = await prisma.entry.findMany({
    where: { workspaceId, walletId: wallet.id, installmentTotal: { not: null } },
    select: { installmentNumber: true, installmentTotal: true, dueDate: true },
  });
  const existingInstallmentKeys = new Set(
    existingInstallments
      .filter((e) => e.installmentNumber != null && e.installmentTotal != null)
      .map((e) => installmentKey(e.installmentNumber!, e.installmentTotal!, e.dueDate)),
  );

  const { records, skippedDuplicateInstallments } = pdfTransactionsToRows(transactions, {
    walletName: wallet.name,
    cardConfig,
    responsibleName: responsible.name,
    categorySuggestions,
    fallbackCategoryNameByNature: { DESPESA: fallbackDespesa.name, RECEITA: fallbackReceita.name },
    today,
    existingInstallmentKeys,
  });

  return { headers: [...PDF_ROW_HEADERS], records, skippedDuplicateInstallments };
}
