"use client";

import { useRef } from "react";
import { setActiveWorkspace } from "@/lib/workspace/switch";

export interface WorkspaceOption {
  workspaceId: string;
  workspaceName: string;
  role: string;
}

export interface WorkspaceSwitcherProps {
  memberships: WorkspaceOption[];
  currentWorkspaceId: string;
  email: string | null | undefined;
  isPlatformAdmin: boolean;
}

/**
 * Arquitetura de Identidade/Planos, Fase 2 Etapa 3 — seletor de workspace.
 * Com 1 membership só (todo usuário real hoje), renderiza texto estático
 * idêntico ao de sempre — zero mudança visual para quem já usa o sistema.
 * Só vira um `<select>` de verdade quando a pessoa tem mais de uma
 * Membership ativa (ex.: dono do workspace próprio + ADVISOR em workspace
 * de cliente) — cenário que ainda não existe em produção, mas o mecanismo
 * já funciona pronto para quando existir.
 */
export function WorkspaceSwitcher({
  memberships,
  currentWorkspaceId,
  email,
  isPlatformAdmin,
}: WorkspaceSwitcherProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const current = memberships.find((m) => m.workspaceId === currentWorkspaceId);
  const isAdvisorHere = current?.role === "ADVISOR";

  return (
    <div className="min-w-0 flex-1">
      {memberships.length <= 1 ? (
        <p className="truncate text-sm font-medium text-white">{current?.workspaceName ?? "Sem workspace"}</p>
      ) : (
        <form ref={formRef} action={setActiveWorkspace}>
          <select
            name="workspaceId"
            defaultValue={currentWorkspaceId}
            onChange={() => formRef.current?.requestSubmit()}
            aria-label="Trocar de workspace"
            className="w-full truncate rounded bg-transparent text-sm font-medium text-white"
          >
            {memberships.map((m) => (
              <option key={m.workspaceId} value={m.workspaceId} style={{ backgroundColor: "#131A47", color: "#fff" }}>
                {m.workspaceName}
              </option>
            ))}
          </select>
        </form>
      )}
      <p className="truncate text-xs text-indigo-300">
        {email}
        {current?.role ? ` · ${current.role}` : ""}
        {isPlatformAdmin ? " · admin" : ""}
        {isAdvisorHere && (
          <span className="ml-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
            você está em workspace de cliente
          </span>
        )}
      </p>
    </div>
  );
}
