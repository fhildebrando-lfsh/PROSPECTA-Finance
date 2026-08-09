import type { PdfStatementTransaction } from "../types";

/** Lê o texto já extraído (uma página por item) de uma fatura de um banco específico. */
export type FaturaParser = (pages: string[]) => PdfStatementTransaction[];

/**
 * Um leitor por banco, indexado pelo slug da `Institution` (`lib/slug.ts`).
 * Começa vazio de propósito — nenhum PDF de exemplo real foi compartilhado
 * ainda (cada banco formata a fatura de um jeito diferente). Assim que o
 * usuário mandar um extrato real, o próximo passo é ler a estrutura do texto
 * extraído (`extract-text.ts::extractPdfText`) e escrever
 * `parsers/{banco}.ts`, registrando aqui — o resto da importação (senha,
 * consentimento, deduplicação de parcelamento, preview/commit) já fica
 * pronto, só falta o leitor de cada banco.
 */
export const FATURA_PARSERS: Record<string, FaturaParser> = {};

export function getFaturaParser(institutionSlug: string | null): FaturaParser | null {
  if (!institutionSlug) return null;
  return FATURA_PARSERS[institutionSlug] ?? null;
}
