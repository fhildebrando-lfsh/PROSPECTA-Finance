import { Decimal, type FinanceEntry } from "@/lib/finance/types";

let counter = 0;

/** Fábrica de FinanceEntry para os testes, com defaults sensatos. */
export function makeEntry(overrides: Partial<FinanceEntry> = {}): FinanceEntry {
  counter += 1;
  return {
    id: `entry-${counter}`,
    walletId: "wallet-1",
    categoryId: "category-1",
    nature: "DESPESA",
    amount: new Decimal(-100),
    transactionDate: new Date(Date.UTC(2026, 0, 1)),
    dueDate: new Date(Date.UTC(2026, 0, 1)),
    status: "PAGO",
    recurrenceKind: "UNICA",
    ...overrides,
  };
}

export function d(value: number | string): Decimal {
  return new Decimal(value);
}
