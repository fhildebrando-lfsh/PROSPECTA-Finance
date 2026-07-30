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

/**
 * Normaliza telefone pro formato que o link `wa.me` exige: só dígitos, com
 * DDI. Usuário digita no formato brasileiro comum (com DDD, sem DDI) — se o
 * número tiver 10 ou 11 dígitos (DDD + fixo/celular), assume Brasil e
 * prefixa "55". Números mais longos já são tratados como tendo DDI.
 */
export function toWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 11 ? `55${digits}` : digits;
}
