"use client";

import { useState } from "react";
import { blockWorkspaceAccess, unblockWorkspaceAccess } from "./actions";
import { BLOCK_REASON_LABELS, MANUAL_BLOCK_REASONS } from "@/lib/workspace/block-reasons";
import { BTN_DANGER } from "@/components/ui/buttonStyles";
import type { WorkspaceBlockReason } from "@/app/generated/prisma/enums";

/**
 * Bloquear/desbloquear o acesso de todo mundo que usa este workspace — alternativa a
 * excluir a conta do cliente (§ pedido do usuário, 2026-08-12). Mesmo esqueleto de
 * `components/AdvisorControl.tsx`: fechado mostra o status atual, aberto vira um
 * `<form>` com o motivo. Desbloquear é ação de um clique (com `confirm()`, mesmo padrão
 * de `PlatformAdminToggle.tsx`) — não precisa do formulário expandido.
 */
export function BlockAccessControl({
  workspaceId,
  blockedReason,
  workspaceLabel,
}: {
  workspaceId: string;
  blockedReason: WorkspaceBlockReason | null;
  workspaceLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<WorkspaceBlockReason>("FATURA_EM_ABERTO");

  if (blockedReason) {
    const isPendingApproval = blockedReason === "AGUARDANDO_APROVACAO";
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className={isPendingApproval ? "text-amber-400" : "text-red-400"}>
          {isPendingApproval ? "Aguardando aprovação" : `Bloqueado — ${BLOCK_REASON_LABELS[blockedReason]}`}
        </span>
        <form
          action={unblockWorkspaceAccess}
          onSubmit={(e) => {
            const msg = isPendingApproval
              ? `Aprovar o acesso de ${workspaceLabel}?`
              : `Desbloquear o acesso de ${workspaceLabel}?`;
            if (!confirm(msg)) e.preventDefault();
          }}
        >
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <button type="submit" className="text-indigo-300 hover:text-white">
            {isPendingApproval ? "aprovar acesso" : "desbloquear"}
          </button>
        </form>
      </span>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-red-400 hover:text-red-300">
        Bloquear acesso
      </button>
    );
  }

  return (
    <form action={blockWorkspaceAccess} onSubmit={() => setOpen(false)} className="flex flex-col items-start gap-1.5">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <select
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value as WorkspaceBlockReason)}
        className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
      >
        {MANUAL_BLOCK_REASONS.map((r) => (
          <option key={r} value={r}>
            {BLOCK_REASON_LABELS[r]}
          </option>
        ))}
      </select>
      {reason === "OUTRO" && (
        <textarea
          name="detail"
          required
          placeholder="Mensagem exata que o cliente vai ver"
          rows={2}
          className="w-56 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs text-zinc-100"
        />
      )}
      <div className="flex gap-1">
        <button type="submit" className={`${BTN_DANGER} px-2 py-0.5 text-xs`}>
          Confirmar bloqueio
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
          cancelar
        </button>
      </div>
    </form>
  );
}
