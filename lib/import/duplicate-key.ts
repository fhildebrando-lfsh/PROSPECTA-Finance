import type { Decimal } from "@/lib/finance/types";

/** §18.1 — chave de duplicata: due_date + amount + description + wallet. */
export function duplicateKey(row: {
  dueDate: Date;
  amount: Decimal;
  description: string;
  walletName: string;
}): string {
  return [
    row.dueDate.toISOString().slice(0, 10),
    row.amount.toFixed(2),
    row.description.trim().toLowerCase(),
    row.walletName.trim().toLowerCase(),
  ].join("|");
}
