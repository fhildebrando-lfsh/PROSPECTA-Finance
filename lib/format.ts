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

/** Abreviação pt-BR de mês, indexada 0-based (jan=0) — mesma lista usada no Painel. */
export const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** dd/mm/aaaa, ignorando fuso — a data já é "pura" (§15). */
export function formatDateBR(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Normaliza telefone para o formato que o link `wa.me` exige: só dígitos, com
 * DDI. Usuário digita no formato brasileiro comum (com DDD, sem DDI) — se o
 * número tiver 10 ou 11 dígitos (DDD + fixo/celular), assume Brasil e
 * prefixa "55". Números mais longos já são tratados como tendo DDI.
 */
export function toWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.length <= 11 ? `55${digits}` : digits;
}

/** Primeiro + segundo nome, para identificar gente em listas curtas sem o nome
 * completo tomar o espaço todo (ex.: junto do e-mail em "Meus clientes"). */
export function firstTwoNames(fullName: string | null): string | null {
  if (!fullName) return null;
  return fullName.trim().split(/\s+/).slice(0, 2).join(" ") || null;
}

/** "Nome Sobrenome — email@x.com", com fallback para o e-mail sozinho sem nome. */
export function identifyPerson(fullName: string | null, email: string): string {
  const name = firstTwoNames(fullName);
  return name ? `${name} — ${email}` : email;
}
