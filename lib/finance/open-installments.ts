import { Decimal, type EntryStatus } from "./types";
import { SETTLED_FOR_BALANCE } from "./balance";

/**
 * Subconjunto de `Entry` (não `FinanceEntry` — que é deliberadamente enxuto e
 * não carrega `description`/`installmentNumber`/`installmentTotal`) com só os
 * campos que "Despesas parceladas" (§13, aba RDP) precisa. Escopo local a
 * este relatório, pra não inflar o contrato de `FinanceEntry` usado por todo
 * o resto do sistema.
 */
export interface InstallmentEntry {
  id: string;
  groupId: string | null;
  walletId: string;
  categoryId: string;
  description: string;
  amount: Decimal;
  dueDate: Date;
  status: EntryStatus;
  installmentNumber: number | null;
  installmentTotal: number | null;
}

export interface OpenInstallmentGroup {
  groupId: string;
  description: string;
  walletId: string;
  categoryId: string;
  installmentTotal: number;
  paidCount: number;
  remainingCount: number;
  /** Soma das parcelas ainda não liquidadas (com sinal, §8.3). */
  remainingAmount: Decimal;
  nextDueDate: Date | null;
  /** "Prazo" — vencimento da última parcela do grupo. */
  lastDueDate: Date;
}

/**
 * Agrupa entries parceladas (`installmentTotal >= 2`) por `groupId` e resume
 * quanto falta de cada uma — "Despesas parceladas" (RDP). Recorrências sem
 * fim (MENSAL, ANUAL, etc.) não têm `installmentTotal` e ficam fora por
 * construção: essa tela é sobre parcelamento finito, não assinatura. Só
 * devolve grupos com pelo menos 1 parcela em aberto (`remainingCount > 0`) —
 * um financiamento já quitado não é "despesa parcelada em aberto".
 */
export function openInstallmentGroups(entries: InstallmentEntry[]): OpenInstallmentGroup[] {
  const byGroup = new Map<string, InstallmentEntry[]>();
  for (const entry of entries) {
    if (!entry.groupId || !entry.installmentTotal || entry.installmentTotal < 2) continue;
    const list = byGroup.get(entry.groupId) ?? [];
    list.push(entry);
    byGroup.set(entry.groupId, list);
  }

  const groups: OpenInstallmentGroup[] = [];
  for (const [groupId, groupEntries] of byGroup) {
    const sorted = [...groupEntries].sort((a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0));
    const unpaid = sorted.filter((e) => !SETTLED_FOR_BALANCE.has(e.status));

    if (unpaid.length === 0) continue; // grupo já totalmente liquidado — fora do escopo desta tela

    const paidCount = sorted.length - unpaid.length;
    const remainingAmount = unpaid.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

    groups.push({
      groupId,
      description: sorted[0].description,
      walletId: sorted[0].walletId,
      categoryId: sorted[0].categoryId,
      installmentTotal: sorted[0].installmentTotal!,
      paidCount,
      remainingCount: unpaid.length,
      remainingAmount,
      nextDueDate: unpaid[0].dueDate,
      lastDueDate: sorted[sorted.length - 1].dueDate,
    });
  }

  return groups.sort((a, b) => (a.nextDueDate?.getTime() ?? 0) - (b.nextDueDate?.getTime() ?? 0));
}
