// Importa direto de "@prisma/client-runtime-utils" (não de "@/lib/finance/types")
// porque este módulo e os leitores de banco em `parsers/` rodam no navegador,
// dentro do ImportWizard.tsx (Client Component) — "@/lib/finance/types" reexporta
// o `Decimal` de "@prisma/client/runtime/client", que carrega imports Node-only
// (node:fs, node:crypto etc.) e quebra o build do webpack no bundle do cliente.
// É a mesma classe (o client.mjs também reexporta dali), então totalmente
// compatível com o `Decimal` usado no resto do sistema.
import { Decimal } from "@prisma/client-runtime-utils";

export { Decimal };

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
