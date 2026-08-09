import { statementWindowForDate, type CardConfig } from "@/lib/finance/card";
import { generateInstallments } from "@/lib/finance/installments";
import { formatDateBR } from "@/lib/format";
import type { CategorySuggestion } from "../suggest-category-bulk";
import type { PdfStatementTransaction } from "./types";

/** Mesmos cabeçalhos canônicos de `ofx-to-rows.ts`, mais "Subcategoria" (que nem OFX nem
 * PDF preenchiam até agora — `CategorySuggestion.subcategoryId` ficava sem uso) —
 * `autoDetectMapping()` já reconhece "Subcategoria" (ver `column-mapping.ts`). */
export const PDF_ROW_HEADERS = [
  "Compra",
  "Vence",
  "Tipo de Carteira",
  "Tipo",
  "Categoria",
  "Subcategoria",
  "Descrição",
  "Responsáveis",
  "Valor",
  "Recorrência",
  "Situação",
] as const;

const NO_HISTORY_REVIEW_REASON =
  "Categoria padrão aplicada na importação de fatura em PDF — não havia histórico para esta descrição. Confira e ajuste se necessário.";

const ORPHAN_INSTALLMENT_REVIEW_REASON =
  "Parcela detectada na fatura sem a parcela anterior já lançada neste sistema — confira o número da parcela e o valor antes de confirmar.";

/** Regra "aprendida" ao editar um lançamento de fatura em Cartões de Crédito (ver model
 * `DescriptionRule`) — quando existe pra uma descrição, tem prioridade sobre a sugestão
 * por histórico de frequência (`CategorySuggestion`). */
export interface DescriptionRuleMatch {
  customDescription: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
}

export interface PdfRowContext {
  walletName: string;
  cardConfig: CardConfig;
  responsibleName: string;
  categorySuggestions: Map<string, CategorySuggestion>;
  /** Chave: descrição original do banco normalizada (trim + minúsculo) — mesma
   * normalização de `categorySuggestions`. */
  descriptionRules: Map<string, DescriptionRuleMatch>;
  fallbackCategoryNameByNature: Record<"DESPESA" | "RECEITA", string>;
  today: Date;
  /** Chave `${installmentTotal}:${installmentNumber}:${AAAA-MM-DD do vencimento}` de
   * parcelas já lançadas nesta carteira — usada para nunca duplicar uma parcela que
   * reaparece na fatura de um mês seguinte (ver `installmentKey`). */
  existingInstallmentKeys: Set<string>;
}

export function installmentKey(installmentNumber: number, installmentTotal: number, dueDate: Date): string {
  return `${installmentTotal}:${installmentNumber}:${dueDate.toISOString().slice(0, 10)}`;
}

function buildRow(
  ctx: PdfRowContext,
  input: {
    postedDate: Date;
    amount: PdfStatementTransaction["amount"];
    description: string;
    dueDate: Date;
    installmentNumber: number | null;
    installmentTotal: number | null;
    reviewReason?: string;
  },
): Record<string, string> {
  const nature: "DESPESA" | "RECEITA" = input.amount.isNegative() ? "DESPESA" : "RECEITA";
  const normalizedDescription = input.description.trim().toLowerCase();
  const rule = ctx.descriptionRules.get(normalizedDescription);
  const suggestion = ctx.categorySuggestions.get(normalizedDescription);

  const description = rule ? rule.customDescription : input.description;
  const categoryName = rule ? rule.categoryName : suggestion ? suggestion.categoryName : ctx.fallbackCategoryNameByNature[nature];
  const subcategoryName = rule ? rule.subcategoryName : (suggestion?.subcategoryName ?? null);

  const settled = input.dueDate.getTime() <= ctx.today.getTime();
  const statusLabel = nature === "DESPESA" ? (settled ? "Pago" : "A pagar") : settled ? "Recebido" : "A receber";

  const row: Record<string, string> = {
    Compra: formatDateBR(input.postedDate),
    Vence: formatDateBR(input.dueDate),
    "Tipo de Carteira": ctx.walletName,
    Tipo: nature,
    Categoria: categoryName,
    Subcategoria: subcategoryName ?? "",
    Descrição: description,
    Responsáveis: ctx.responsibleName,
    Valor: input.amount.toFixed(2).replace(".", ","),
    Recorrência:
      input.installmentNumber && input.installmentTotal ? `${input.installmentNumber}/${input.installmentTotal}` : "1",
    Situação: statusLabel,
  };

  const reason = input.reviewReason ?? (!rule && !suggestion ? NO_HISTORY_REVIEW_REASON : null);
  if (reason) row.__autoReviewReason = reason;
  // Chave interna, fora do ColumnMapping normal — parse-row.ts lê direto do raw row (não
  // é uma coluna mapeável pelo usuário). Sempre o texto ORIGINAL do banco, mesmo quando
  // uma regra substitui `Descrição` acima — é a chave estável que `DescriptionRule` usa
  // pra reconhecer a mesma compra em faturas futuras.
  row.__importedDescription = input.description;
  return row;
}

export interface PdfRowsResult {
  records: Record<string, string>[];
  /** Parcelas que já existiam (lançadas manualmente ou por uma importação de mês
   * anterior) — descartadas silenciosamente para não duplicar, contadas aqui. */
  skippedDuplicateInstallments: number;
}

/**
 * Converte transações de fatura em PDF já extraídas nas mesmas linhas canônicas que
 * CSV/OFX usam — mesma ideia de `ofxTransactionsToRows`, mas com uma regra própria de
 * deduplicação de parcelamento (confirmada com o usuário, "100% imprescindível"):
 * fatura de cartão lista a mesma parcela todo mês (ex.: "MAGALU 02/10"), e o texto que o
 * banco imprime raramente bate com o que a pessoa digitaria à mão — então a
 * deduplicação aqui é sempre por carteira + total de parcelas + número da parcela +
 * vencimento, nunca por igualdade de descrição.
 *
 * Quando uma série de parcelamento aparece pela primeira vez (parcela 1, sem nenhuma
 * parcela já lançada), gera a série completa de uma vez (mesma lógica do lançamento
 * manual, `generateInstallments`) — os meses futuros já ficam prontos, e a fatura do mês
 * seguinte reconhece e pula essas parcelas quando reaparecerem (checagem acima).
 */
export function pdfTransactionsToRows(transactions: PdfStatementTransaction[], ctx: PdfRowContext): PdfRowsResult {
  const records: Record<string, string>[] = [];
  let skippedDuplicateInstallments = 0;

  for (const transaction of transactions) {
    const dueDate = statementWindowForDate(ctx.cardConfig, transaction.postedDate).dueDate;

    if (!transaction.installmentTotal || !transaction.installmentNumber) {
      records.push(
        buildRow(ctx, {
          postedDate: transaction.postedDate,
          amount: transaction.amount,
          description: transaction.description,
          dueDate,
          installmentNumber: null,
          installmentTotal: null,
        }),
      );
      continue;
    }

    if (ctx.existingInstallmentKeys.has(installmentKey(transaction.installmentNumber, transaction.installmentTotal, dueDate))) {
      skippedDuplicateInstallments += 1; // já lançada — some da fatura sem duplicar
      continue;
    }

    if (transaction.installmentNumber > 1) {
      // Parcela 2+ sem a 1ª conhecida (ex.: começou a usar o sistema no meio de um
      // parcelamento) — importa só esta linha, sinalizada para revisão manual, em vez
      // de tentar reconstruir parcelas já vencidas que nunca foram lançadas.
      records.push(
        buildRow(ctx, {
          postedDate: transaction.postedDate,
          amount: transaction.amount,
          description: transaction.description,
          dueDate,
          installmentNumber: transaction.installmentNumber,
          installmentTotal: transaction.installmentTotal,
          reviewReason: ORPHAN_INSTALLMENT_REVIEW_REASON,
        }),
      );
      continue;
    }

    const installments = generateInstallments({
      totalInstallments: transaction.installmentTotal,
      firstDueDate: dueDate,
      transactionDate: transaction.postedDate,
      amount: transaction.amount,
      groupId: "n/a", // não usado na síntese de linha — groupId de verdade é atribuído no commit (clusterInstallmentRows)
    });
    for (const inst of installments) {
      records.push(
        buildRow(ctx, {
          postedDate: transaction.postedDate,
          amount: inst.amount,
          description: transaction.description,
          dueDate: inst.dueDate,
          installmentNumber: inst.installmentNumber,
          installmentTotal: inst.installmentTotal,
        }),
      );
    }
  }

  return { records, skippedDuplicateInstallments };
}
