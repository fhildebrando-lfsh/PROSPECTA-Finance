import type { EntryStatus } from "./types";
import { daysBetween } from "./dates";

/** Entram no saldo realizado (§11.1) e são sempre "Ok" em Resultado (§10 R3). */
const OK_STATUSES = new Set<EntryStatus>(["PAGO", "RECEBIDO", "ISENTO", "AQUISICAO", "ATUALIZACAO"]);

/**
 * §10 R3 — `Resultado` é sempre derivado, nunca digitado.
 *
 * se status ∈ {PAGO, RECEBIDO, ISENTO, AQUISICAO, ATUALIZACAO} → "Ok"
 * senão se due_date < hoje  → "vencido há {N} dias"
 * senão se status = A_RECEBER → "a receber em {N} dias"
 * senão                      → "a pagar em {N} dias"
 */
export function derivedStatus(
  entry: { status: EntryStatus; dueDate: Date },
  today: Date = new Date(),
): string {
  if (OK_STATUSES.has(entry.status)) return "Ok";

  const days = daysBetween(today, entry.dueDate);
  if (days < 0) return `vencido há ${Math.abs(days)} dias`;
  if (entry.status === "A_RECEBER") return `a receber em ${days} dias`;
  return `a pagar em ${days} dias`;
}

export type EntryUrgency = "settled" | "upcoming" | "overdue";

/**
 * Classificação grosseira do mesmo cálculo de `derivedStatus`, pensada
 * pra UI decidir cor de linha em vez de mostrar texto: liquidado fica
 * discreto, a vencer é neutro, atrasado precisa chamar atenção de verdade.
 */
export function entryUrgency(entry: { status: EntryStatus; dueDate: Date }, today: Date = new Date()): EntryUrgency {
  if (OK_STATUSES.has(entry.status)) return "settled";
  return daysBetween(today, entry.dueDate) < 0 ? "overdue" : "upcoming";
}
