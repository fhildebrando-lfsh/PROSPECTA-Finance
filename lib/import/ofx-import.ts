import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { OFX_ROW_HEADERS, ofxTransactionsToRows } from "./ofx-to-rows";
import { parseOfx } from "./parse-ofx";
import { suggestCategoriesByDescription } from "./suggest-category-bulk";

export interface OfxImportParams {
  walletId: string;
  responsibleId: string;
  fallbackCategoryDespesaId: string;
  fallbackCategoryReceitaId: string;
}

export interface OfxImportResult {
  headers: string[];
  records: Record<string, string>[];
  skippedRows: number;
}

/**
 * Resolve um pedido de importação de OFX inteiro (carteira/responsável/categorias
 * padrão vêm por ID, escolhidos uma vez pra o arquivo inteiro — OFX não tem essa
 * informação por linha) e devolve o mesmo formato de `parseCsvWithHeaderDetection`
 * — usada igual pelas rotas de preview e commit, única fonte da lógica de
 * resolução/síntese, pra não duplicar a busca de carteira/responsável/categorias.
 */
export async function buildOfxImportRows(
  workspaceId: string,
  ofxText: string,
  params: OfxImportParams,
): Promise<OfxImportResult> {
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

  const { transactions, skipped } = parseOfx(ofxText);
  const categorySuggestions = await suggestCategoriesByDescription(workspaceId);

  const cardConfig =
    wallet.kindCode === "CARTAO_CREDITO" && wallet.closingDay && wallet.dueDay
      ? { closingDay: wallet.closingDay, dueDay: wallet.dueDay }
      : null;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const records = ofxTransactionsToRows(transactions, {
    walletName: wallet.name,
    cardConfig,
    responsibleName: responsible.name,
    categorySuggestions,
    fallbackCategoryNameByNature: { DESPESA: fallbackDespesa.name, RECEITA: fallbackReceita.name },
    today,
  });

  return { headers: [...OFX_ROW_HEADERS], records, skippedRows: skipped };
}
