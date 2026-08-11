import type { EntryStatus } from "./types";
import { daysBetween } from "./dates";

/**
 * Situações liquidadas (`Status.countsAsSettled = true`) — entram no saldo
 * realizado (§11.1) e são sempre "Ok" em Resultado (§10 R3). Fonte única
 * reusada por `period.ts`/`rankings.ts`/`reserve.ts` para separar
 * "realizado" (liquidado) de "provisão"/expectativa (pendente) — pedido do
 * usuário, 2026-08-11: totais do sistema devem representar o que foi
 * efetivamente recebido/pago, nunca misturar com o que ainda está pendente.
 */
export const SETTLED_STATUSES = new Set<EntryStatus>(["PAGO", "RECEBIDO", "ISENTO", "AQUISICAO", "ATUALIZACAO"]);

/** Complemento exato de `SETTLED_STATUSES` (`countsAsSettled = false`) — o que ainda está pendente/futuro. */
export const PENDING_STATUSES = new Set<EntryStatus>(["A_PAGAR", "A_RECEBER", "ESTIMATIVA"]);

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
  if (SETTLED_STATUSES.has(entry.status)) return "Ok";

  const days = daysBetween(today, entry.dueDate);
  if (days < 0) return `vencido há ${Math.abs(days)} dias`;
  if (entry.status === "A_RECEBER") return `a receber em ${days} dias`;
  return `a pagar em ${days} dias`;
}

export type EntryUrgency = "settled" | "upcoming" | "overdue";

/**
 * Classificação grosseira do mesmo cálculo de `derivedStatus`, pensada
 * para a UI decidir cor de linha em vez de mostrar texto: liquidado fica
 * discreto, a vencer é neutro, atrasado precisa chamar atenção de verdade.
 */
export function entryUrgency(entry: { status: EntryStatus; dueDate: Date }, today: Date = new Date()): EntryUrgency {
  if (SETTLED_STATUSES.has(entry.status)) return "settled";
  return daysBetween(today, entry.dueDate) < 0 ? "overdue" : "upcoming";
}
