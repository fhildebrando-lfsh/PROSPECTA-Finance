import type { PdfStatementTransaction } from "../types";
import { parseCasasBahiaFatura } from "./casas-bahia";
import { parseItauFatura } from "./itau";
import { parseNubankFatura } from "./nubank";
import { parsePortoSeguroFatura } from "./porto-seguro";
import { parseSantanderFatura } from "./santander";

/** Lê o texto já extraído (uma página por item) de uma fatura de um banco específico. */
export type FaturaParser = (pages: string[]) => PdfStatementTransaction[];

/**
 * Um leitor por banco, indexado pelo slug da `Institution` (`lib/slug.ts`).
 * Cada leitor novo vem de um PDF de exemplo real compartilhado pelo usuário
 * (Registro Nº 041 em diante) — o resto da importação (senha, consentimento,
 * deduplicação de parcelamento, preview/commit) já fica pronto, só falta o
 * leitor de cada banco.
 */
export const FATURA_PARSERS: Record<string, FaturaParser> = {
  nubank: parseNubankFatura,
  casas_bahia: parseCasasBahiaFatura,
  porto_seguro: parsePortoSeguroFatura,
  itau: parseItauFatura,
  santander: parseSantanderFatura,
};

export function getFaturaParser(institutionSlug: string | null): FaturaParser | null {
  if (!institutionSlug) return null;
  return FATURA_PARSERS[institutionSlug] ?? null;
}
