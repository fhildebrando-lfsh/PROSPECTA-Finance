import { Decimal } from "@/lib/finance/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** §15 — locale pt-BR em toda formatação. "-1.234,56" / "R$ 1.234,56". */
export function formatCurrencyBRL(amount: Decimal | number): string {
  const value = amount instanceof Decimal ? amount.toNumber() : amount;
  return currencyFormatter.format(value);
}

/** dd/mm/aaaa, ignorando fuso — a data já é "pura" (§15). */
export function formatDateBR(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
