"use client";

import { useRef } from "react";
import { setPatrimonyFunction } from "./actions";

export interface FunctionOption {
  value: string;
  label: string;
}

/**
 * Salva na hora que muda (sem botão "Salvar") — classificar patrimônio é uma
 * sessão de muitos itens seguidos; um botão por linha viraria atrito puro.
 * Nenhum import de `@/lib/format` aqui: ele carrega `Decimal` pro bundle de
 * Client Component (gotcha já documentado em `WalletReconcileControl.tsx`) —
 * o valor chega pronto do servidor, como texto.
 */
export function FunctionSelect({
  id,
  kind,
  current,
  options,
}: {
  id: string;
  kind: string;
  current: string;
  options: FunctionOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={setPatrimonyFunction} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <select
        name="funcao"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs text-zinc-100"
      >
        <option value="">— sem função —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
