"use client";

import { useState } from "react";

/** Campo de dia do mês (1-28) — só aceita dígitos, no máximo 2, filtrando
 * qualquer letra digitada em tempo real (não só na hora de enviar o formulário). */
export function DayInput({
  name,
  defaultValue,
  required,
  disabled,
  className,
}: {
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue != null ? String(defaultValue) : "");

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]{1,2}"
      maxLength={2}
      name={name}
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 2))}
      required={required}
      disabled={disabled}
      className={className}
    />
  );
}
