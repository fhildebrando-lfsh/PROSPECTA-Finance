"use client";

import { setAdvisorWrite } from "@/app/(app)/admin/usuarios/actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

/**
 * Etapa 0 (2026-08-15) — consultor nasce só com leitura; este controle é a
 * única forma de conceder/revogar escrita, sempre auditada em AccessLog
 * (lib/workspace/advisor.ts::setAdvisorWriteAccess). Só aparece quando há
 * consultor ativo (page.tsx não renderiza este componente sem isso).
 */
export function AdvisorWriteToggle({ workspaceId, canWrite }: { workspaceId: string; canWrite: boolean }) {
  return (
    <form action={setAdvisorWrite} className="inline-flex items-center gap-1.5 text-xs">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="canWrite" value={(!canWrite).toString()} />
      <span className={canWrite ? "text-emerald-400" : "text-zinc-500"}>
        Escrita: {canWrite ? "concedida" : "só leitura"}
      </span>
      <button type="submit" className={`${BTN_SECONDARY} px-2 py-0.5 text-xs`}>
        {canWrite ? "revogar" : "conceder"}
      </button>
    </form>
  );
}
