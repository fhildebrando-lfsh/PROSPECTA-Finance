import { statementWindowForDate, type CardConfig } from "@/lib/finance/card";
import { formatDateBR } from "@/lib/format";
import type { OfxTransaction } from "./parse-ofx";
import type { CategorySuggestion } from "./suggest-category-bulk";

/** Cabeçalhos canônicos que `column-mapping.ts::KNOWN_HEADERS` já reconhece — usados
 * como está em cada linha sintetizada, então `autoDetectMapping()` mapeia tudo sozinho. */
export const OFX_ROW_HEADERS = [
  "Compra",
  "Vence",
  "Tipo de Carteira",
  "Tipo",
  "Categoria",
  "Descrição",
  "Responsáveis",
  "Valor",
  "Recorrência",
  "Situação",
] as const;

/** Texto gravado em `Entry.autoReviewReason` — some da linha assim que confirmada
 * ou editada em Compromissos → Incidentes (ver lib/finance/incidents.ts). */
const NO_HISTORY_REVIEW_REASON =
  "Categoria padrão aplicada na importação de OFX — não havia histórico para esta descrição. Confira e ajuste se necessário.";

export interface OfxRowContext {
  walletName: string;
  /** Presente só quando a carteira escolhida é CARTAO_CREDITO com closingDay/dueDay
   * configurados — nesse caso o vencimento é o da fatura que contém a compra, não a
   * própria data de compra (§11.4, mesma lógica do lançamento rápido). */
  cardConfig: CardConfig | null;
  responsibleName: string;
  categorySuggestions: Map<string, CategorySuggestion>;
  /** Extrato bancário só produz DESPESA (valor negativo) ou RECEITA (positivo) —
   * nunca INVESTIMENTO/OUTRO, que exigem contexto que o OFX não tem. */
  fallbackCategoryNameByNature: Record<"DESPESA" | "RECEITA", string>;
  /** Data "de hoje" (pura, UTC) — decide Pago/Recebido vs. A pagar/A receber. */
  today: Date;
}

/**
 * Converte transações OFX já parseadas nas mesmas linhas `Record<string,string>`
 * que a importação de CSV usa (`lib/import/column-mapping.ts::KNOWN_HEADERS`) —
 * o resto do pipeline (validação, resolução de IDs, deduplicação, agrupamento de
 * parcelas, commit atômico) roda sem nenhuma mudança, CSV ou OFX.
 */
export function ofxTransactionsToRows(transactions: OfxTransaction[], ctx: OfxRowContext): Record<string, string>[] {
  return transactions.map((transaction) => {
    const nature: "DESPESA" | "RECEITA" = transaction.amount.isNegative() ? "DESPESA" : "RECEITA";

    const dueDate = ctx.cardConfig
      ? statementWindowForDate(ctx.cardConfig, transaction.postedDate).dueDate
      : transaction.postedDate;

    const suggestion = ctx.categorySuggestions.get(transaction.description.trim().toLowerCase());
    const categoryName = suggestion ? suggestion.categoryName : ctx.fallbackCategoryNameByNature[nature];

    const settled = dueDate.getTime() <= ctx.today.getTime();
    const statusLabel =
      nature === "DESPESA" ? (settled ? "Pago" : "A pagar") : settled ? "Recebido" : "A receber";

    const row: Record<string, string> = {
      Compra: formatDateBR(transaction.postedDate),
      Vence: formatDateBR(dueDate),
      "Tipo de Carteira": ctx.walletName,
      Tipo: nature,
      Categoria: categoryName,
      Descrição: transaction.description,
      Responsáveis: ctx.responsibleName,
      // §18.1 espera decimal com vírgula (parseBrlAmount) — TRNAMT do OFX já foi
      // convertido pra Decimal em parse-ofx.ts, aqui só formata de volta.
      Valor: transaction.amount.toFixed(2).replace(".", ","),
      // "1" -> parseRecorrencia() vira UNICA/installmentNumber=1/installmentTotal=null,
      // que não conta como parcelamento em Dívidas/Despesas Parceladas/Incidentes —
      // correto pra um extrato bancário, que nunca tem essa informação por linha.
      Recorrência: "1",
      Situação: statusLabel,
    };

    // Chave interna, fora do ColumnMapping normal — parse-row.ts lê direto do raw
    // row (não é uma coluna mapeável pelo usuário).
    if (!suggestion) row.__autoReviewReason = NO_HISTORY_REVIEW_REASON;

    return row;
  });
}
