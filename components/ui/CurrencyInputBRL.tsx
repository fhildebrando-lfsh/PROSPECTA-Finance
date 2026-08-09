"use client";

import { useState } from "react";

/** Máximo de dígitos aceitos, batendo com `Decimal(14,2)` no banco (12 dígitos
 * inteiros + 2 decimais). */
const MAX_DIGITS = 14;

export function centsToDisplay(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function centsToRaw(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

export function parseDefaultValueToCents(defaultValue?: string | number | null): number | null {
  if (defaultValue == null || defaultValue === "") return null;
  const parsed = typeof defaultValue === "number" ? defaultValue : parseFloat(defaultValue);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
}

/**
 * Campo de valor em reais, formatado como o cliente já está acostumado a ver
 * em qualquer app de banco (ex.: "R$ 1.500,00") — os dígitos digitados
 * preenchem da direita pra esquerda (primeiro os centavos), sem precisar
 * digitar vírgula ou ponto. Manda pro formulário um valor escondido em
 * formato decimal cru ("1500.00"), o que o Server Action já espera.
 */
export function CurrencyInputBRL({
  name,
  defaultValue,
  required,
  disabled,
  className,
  placeholder,
}: {
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [cents, setCents] = useState<number | null>(() => parseDefaultValueToCents(defaultValue));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, MAX_DIGITS);
    setCents(digits ? Number(digits) : null);
  }

  return (
    <>
      <input
        type="text"
        inputMode="decimal"
        value={centsToDisplay(cents)}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder ?? "R$ 0,00"}
        className={className}
      />
      <input type="hidden" name={name} value={centsToRaw(cents)} />
    </>
  );
}
