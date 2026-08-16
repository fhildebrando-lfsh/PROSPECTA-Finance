"use client";

import { useRef } from "react";
import { updateSubcategoryRigidez } from "./actions";

/**
 * Salva ao trocar, sem botão — revisar rigidez é sessão de muitos itens
 * seguidos, mesmo padrão já usado na Função do Patrimônio.
 */
export function RigidezSelect({ id, current }: { id: string; current: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={updateSubcategoryRigidez} ref={formRef}>
      <input type="hidden" name="id" value={id} />
      <select
        name="rigidez"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs text-zinc-100"
      >
        <option value="">— sem classificação —</option>
        <option value="RIGIDA">Rígida</option>
        <option value="AJUSTAVEL">Ajustável</option>
        <option value="DISCRICIONARIA">Discricionária</option>
      </select>
    </form>
  );
}
