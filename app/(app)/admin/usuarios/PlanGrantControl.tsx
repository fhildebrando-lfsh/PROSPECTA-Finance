"use client";

import { useState } from "react";
import { grantWorkspacePlan, revokeWorkspacePlanGrant } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

// Formatação local — não importa @/lib/format (importa Decimal de
// @/lib/finance/types, que não pode ir pro bundle de Client Component,
// gotcha já documentado, ver WalletReconcileControl.tsx).
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export interface ActiveGrantSummary {
  id: string;
  planName: string;
  reason: string;
  endsAt: string; // ISO
}

export interface PlanOption {
  id: string;
  name: string;
}

/**
 * Etapa 4 do Método (ARQUITETURA-METODO-PROSPECTAR.md §3/5.2, 2026-08-15) —
 * concessão manual de PlanGrant (camada 2 do modelo de direitos, §4.6).
 * Mesmo esqueleto de AdvisorControl/BlockAccessControl: lista o que está
 * ativo, um botão revela o formulário pra conceder mais.
 */
export function PlanGrantControl({
  workspaceId,
  activeGrants,
  planOptions,
}: {
  workspaceId: string;
  activeGrants: ActiveGrantSummary[];
  planOptions: PlanOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="flex flex-col items-start gap-1">
      {activeGrants.map((grant) => (
        <span key={grant.id} className="text-xs text-indigo-300">
          {grant.planName} até {dateFormatter.format(new Date(grant.endsAt))} — {grant.reason}
          <form
            action={revokeWorkspacePlanGrant}
            className="ml-1.5 inline"
            onSubmit={(e) => {
              if (!confirm(`Revogar "${grant.planName}"?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="grantId" value={grant.id} />
            <button type="submit" className="text-zinc-500 hover:text-red-400">
              revogar
            </button>
          </form>
        </span>
      ))}

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-indigo-300 hover:text-white">
          + conceder acesso temporário
        </button>
      ) : (
        <form
          action={grantWorkspacePlan}
          onSubmit={() => setOpen(false)}
          className="flex flex-col items-start gap-1"
        >
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <select
            name="planId"
            required
            defaultValue=""
            className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
          >
            <option value="" disabled>
              — plano —
            </option>
            {planOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            name="reason"
            required
            placeholder="motivo (ex.: cortesia, teste)"
            className="w-48 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
          />
          <input
            name="endsAt"
            type="date"
            required
            className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
          />
          <div className="flex gap-1">
            <button type="submit" className={`${BTN_SECONDARY} px-2 py-0.5 text-xs`}>
              Conceder
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
              cancelar
            </button>
          </div>
        </form>
      )}
    </span>
  );
}
