import type { RecurrenceKind } from "@/lib/finance/types";
import { slugify } from "@/lib/slug";

export interface ParsedRecurrence {
  recurrenceKind: RecurrenceKind;
  installmentNumber: number | null;
  installmentTotal: number | null;
  isPatrimonio: boolean;
  isProjecao: boolean;
  legacyLabel: string;
}

/** seeds/seed_recorrencias.csv — rótulo (normalizado) -> código. */
const LEGACY_LABEL_TO_CODE: Record<string, RecurrenceKind> = {
  variavel: "VARIAVEL",
  mensal: "MENSAL",
  bimestral: "BIMESTRAL",
  trimestral: "TRIMESTRAL",
  quadrimestral: "QUADRIMESTRAL",
  semestral: "SEMESTRAL",
  anual: "ANUAL",
  bienio: "BIENIO",
  trienio: "TRIENIO",
  quinquenio: "QUINQUENIO",
  decenio: "DECENIO",
  vicenio: "VICENIO",
};

/**
 * §8.5 — desmembra a coluna polivalente `Recorrência` da planilha.
 *
 * O formato real observado na planilha (não documentado na especificação
 * original, que só citava números soltos) é "N de M" ou "N/M" — ex.:
 * "64 de 96" e "1/2" = parcela 1 de 2 (as duas formas aparecem na mesma
 * planilha, inconsistência de preenchimento manual ao longo dos anos).
 * Um número solto (`1`, `2`, `105`) também é aceito, mas aí installment_total
 * fica nulo (não há como derivar sem o grupo). `Patrimônio` e `previsão`
 * (§6.4) viram flags booleanas em vez de poluir a enumeração.
 */
export function parseRecorrencia(raw: string): ParsedRecurrence {
  const trimmed = raw.trim();
  if (trimmed === "") throw new Error("recorrência vazia");

  const installmentMatch = /^(\d+)\s*(?:de|\/)\s*(\d+)$/i.exec(trimmed);
  if (installmentMatch) {
    return {
      recurrenceKind: "UNICA",
      installmentNumber: Number.parseInt(installmentMatch[1], 10),
      installmentTotal: Number.parseInt(installmentMatch[2], 10),
      isPatrimonio: false,
      isProjecao: false,
      legacyLabel: trimmed,
    };
  }

  if (/^\d+$/.test(trimmed)) {
    return {
      recurrenceKind: "UNICA",
      installmentNumber: Number.parseInt(trimmed, 10),
      installmentTotal: null,
      isPatrimonio: false,
      isProjecao: false,
      legacyLabel: trimmed,
    };
  }

  const normalized = slugify(trimmed);

  if (normalized === "patrimonio") {
    return {
      recurrenceKind: "UNICA",
      installmentNumber: null,
      installmentTotal: null,
      isPatrimonio: true,
      isProjecao: false,
      legacyLabel: trimmed,
    };
  }

  if (normalized === "previsao") {
    return {
      recurrenceKind: "UNICA",
      installmentNumber: null,
      installmentTotal: null,
      isPatrimonio: false,
      isProjecao: true,
      legacyLabel: trimmed,
    };
  }

  const code = LEGACY_LABEL_TO_CODE[normalized];
  if (code) {
    return {
      recurrenceKind: code,
      installmentNumber: null,
      installmentTotal: null,
      isPatrimonio: false,
      isProjecao: false,
      legacyLabel: trimmed,
    };
  }

  throw new Error(`recorrência desconhecida: "${raw}"`);
}
