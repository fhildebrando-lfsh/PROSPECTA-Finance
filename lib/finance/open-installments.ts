import { Decimal, type EntryStatus } from "./types";
import { SETTLED_FOR_BALANCE } from "./balance";
import { addMonths } from "./dates";

/**
 * Subconjunto de `Entry` (não `FinanceEntry` — que é deliberadamente enxuto e
 * não carrega `description`/`installmentNumber`/`installmentTotal`) com só os
 * campos que "Despesas parceladas" (§13, aba RDP) precisa. Escopo local a
 * este relatório, para não inflar o contrato de `FinanceEntry` usado por todo
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
  /** Soma de todas as parcelas do grupo, pagas + a pagar — magnitude total do compromisso. */
  totalAmount: Decimal;
  /** Valor da próxima parcela em aberto — como todo parcelamento avança mês a mês
   * (`installments.ts::generateInstallments`), é uma proxy correta de "quanto pesa
   * por mês" (usado por Dívidas, §13). Nulo se não sobrou nenhuma parcela em aberto. */
  nextInstallmentAmount: Decimal | null;
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
    const totalAmount = sorted.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

    groups.push({
      groupId,
      description: sorted[0].description,
      walletId: sorted[0].walletId,
      categoryId: sorted[0].categoryId,
      installmentTotal: sorted[0].installmentTotal!,
      paidCount,
      remainingCount: unpaid.length,
      remainingAmount,
      totalAmount,
      nextInstallmentAmount: unpaid[0]?.amount ?? null,
      nextDueDate: unpaid[0].dueDate,
      lastDueDate: sorted[sorted.length - 1].dueDate,
    });
  }

  return groups.sort((a, b) => (a.nextDueDate?.getTime() ?? 0) - (b.nextDueDate?.getTime() ?? 0));
}

export type DebtTerm = "curto" | "longo";

/**
 * Classifica uma dívida em aberto por prazo — pedido do usuário, 2026-08-11: curto prazo
 * = termina em até `thresholdMonths` (padrão 12) a partir de hoje; longo = depois disso.
 * Usa `lastDueDate` ("Prazo (até quando)", já exibido na tela de Dívidas) — a data em
 * que a última parcela do grupo vence, não a próxima.
 */
export function classifyDebtTerm(group: OpenInstallmentGroup, today: Date, thresholdMonths = 12): DebtTerm {
  return group.lastDueDate.getTime() <= addMonths(today, thresholdMonths).getTime() ? "curto" : "longo";
}

/** Dívida total em aberto (§13, "Dívidas") — soma de `remainingAmount` de todos os grupos. */
export function totalRemainingDebt(groups: OpenInstallmentGroup[]): Decimal {
  return groups.reduce((sum, g) => sum.plus(g.remainingAmount), new Decimal(0));
}

/** Compromisso mensal com dívidas — soma da próxima parcela de cada grupo (§13, "impacto no orçamento"). */
export function monthlyDebtCommitment(groups: OpenInstallmentGroup[]): Decimal {
  return groups.reduce((sum, g) => sum.plus(g.nextInstallmentAmount ?? new Decimal(0)), new Decimal(0));
}

export interface DebtTimelinePoint {
  date: Date;
  /** Saldo devedor combinado (magnitude positiva) restante nesta data. */
  remaining: Decimal;
}

/**
 * Linha do tempo de diminuição da dívida (§13, "Dívidas") — só considera as
 * entries dos grupos **atualmente em aberto** (`openGroupIds`, os mesmos que
 * já aparecem na tabela — nunca reintroduz uma dívida já quitada no gráfico).
 * Começa no total contratado desses grupos e desconta cada parcela (paga ou
 * futura) na sua data de vencimento, mostrando o saldo combinado encolhendo
 * até a última parcela.
 */
export function debtDeclineTimeline(entries: InstallmentEntry[], openGroupIds: Set<string>): DebtTimelinePoint[] {
  const relevant = entries.filter((e) => e.groupId && openGroupIds.has(e.groupId));
  const total = relevant.reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0));

  const sorted = [...relevant].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  let running = total;
  return sorted.map((e) => {
    running = running.minus(e.amount.abs());
    return { date: e.dueDate, remaining: running };
  });
}
