import type { RecurrenceKind } from "./types";

const VARIABLE_RECURRENCE_KINDS = new Set<RecurrenceKind>(["UNICA", "VARIAVEL"]);

/**
 * §11.7 — regra automática: recorrência previsível ⇒ fixa. `isFixedOverride`,
 * quando preenchido (não nulo/indefinido), manda — existe porque a regra
 * automática erra em casos reais (financiamento parcelado é a despesa mais
 * fixa que existe, mas `recurrenceKind = UNICA` o classificaria como variável).
 */
export function isFixedExpense(entry: {
  recurrenceKind: RecurrenceKind;
  isFixedOverride?: boolean | null;
}): boolean {
  if (entry.isFixedOverride !== undefined && entry.isFixedOverride !== null) {
    return entry.isFixedOverride;
  }
  return !VARIABLE_RECURRENCE_KINDS.has(entry.recurrenceKind);
}
