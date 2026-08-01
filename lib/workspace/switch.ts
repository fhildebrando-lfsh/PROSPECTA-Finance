"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireProfile, ACTIVE_WORKSPACE_COOKIE } from "@/lib/auth/session";

/**
 * Troca o workspace ativo da sessão (Arquitetura de Identidade/Planos, Fase
 * 2 Etapa 3 — seletor de workspace). Só aceita um `workspaceId` que
 * corresponda a uma Membership `ACTIVE` de verdade da pessoa logada — nunca
 * confia no valor recebido do form sem validar contra a sessão.
 */
export async function setActiveWorkspace(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const profile = await requireProfile();

  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId && m.status === "ACTIVE");
  if (!membership) {
    throw new Error("Sem acesso a este workspace.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias — mesma janela de sessão do §19.2 da especificação.
  });

  redirect("/painel");
}
