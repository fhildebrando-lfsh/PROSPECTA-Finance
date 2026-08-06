"use client";

import { useState } from "react";
import { setAdvisor } from "@/app/(app)/admin/usuarios/actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

interface AdvisorOption {
  id: string;
  label: string;
}

export function AdvisorControl({
  workspaceId,
  currentAdvisorLabel,
  options,
}: {
  workspaceId: string;
  currentAdvisorLabel: string | null;
  options: AdvisorOption[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <span className="inline-flex items-center gap-1.5">
        Consultor: {currentAdvisorLabel ?? <span className="text-zinc-600">nenhum</span>}
        <button type="button" onClick={() => setOpen(true)} className="text-indigo-300 hover:text-white">
          {currentAdvisorLabel ? "trocar" : "atribuir"}
        </button>
      </span>
    );
  }

  return (
    <form action={setAdvisor} onSubmit={() => setOpen(false)} className="inline-flex items-center gap-1.5">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <select
        name="advisorProfileId"
        defaultValue=""
        className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
      >
        <option value="">— nenhum —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button type="submit" className={`${BTN_SECONDARY} px-2 py-0.5 text-xs`}>
        Salvar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
        cancelar
      </button>
    </form>
  );
}
