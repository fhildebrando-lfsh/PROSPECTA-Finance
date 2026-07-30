import type { EntryStatus, FinanceEntry, FinanceWallet, RecurrenceKind } from "./types";

/**
 * As funções de /lib/finance são puras e não conhecem o Prisma — este é o
 * único lugar que traduz uma linha do banco pro tipo que elas esperam.
 */
export function toFinanceEntry(entry: {
  id: string;
  walletId: string;
  categoryId: string;
  nature: string;
  amount: FinanceEntry["amount"];
  transactionDate: Date;
  dueDate: Date;
  statusCode: string;
  recurrenceCode: string;
  isFixedOverride: boolean | null;
  groupId: string | null;
}): FinanceEntry {
  return {
    id: entry.id,
    walletId: entry.walletId,
    categoryId: entry.categoryId,
    nature: entry.nature as FinanceEntry["nature"],
    amount: entry.amount,
    transactionDate: entry.transactionDate,
    dueDate: entry.dueDate,
    status: entry.statusCode as EntryStatus,
    recurrenceKind: entry.recurrenceCode as RecurrenceKind,
    isFixedOverride: entry.isFixedOverride,
    groupId: entry.groupId,
  };
}

export function toFinanceWallet(wallet: { id: string; kindCode: string }): FinanceWallet {
  return { id: wallet.id, kindCode: wallet.kindCode };
}
