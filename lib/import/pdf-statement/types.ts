import { Decimal } from "@/lib/finance/types";

/**
 * Uma linha de compra já extraída do texto de uma fatura em PDF — devolvida
 * por um `FaturaParser` específico de banco (ver `parsers/registry.ts`).
 * `installmentNumber`/`installmentTotal` vêm nulos para compra à vista;
 * preenchidos quando o parser reconhece um contador de parcela na linha
 * (ex.: "MAGALU 02/10").
 */
export interface PdfStatementTransaction {
  postedDate: Date;
  /** Com sinal, como todo `amount` do sistema — compra de cartão é sempre despesa (negativo). */
  amount: Decimal;
  description: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
}
