import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { MembershipRole } from "@/app/generated/prisma/enums";

/**
 * Perfil + memberships do usuário logado, derivados sempre da sessão do
 * Supabase (nunca de input do cliente — §17). `cache()` deduplica a
 * consulta quando layout e página pedem o mesmo dado na mesma requisição.
 */
export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { memberships: { include: { workspace: true } } },
  });

  return profile ? { ...profile, email: user.email } : null;
});

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Workspace primário do usuário (Fase 0: um só). Lança se não houver nenhum. */
export async function requireWorkspaceId() {
  const profile = await requireProfile();
  const membership = profile.memberships[0];
  if (!membership) {
    throw new Error(
      "Usuário autenticado sem workspace. O trigger on_auth_user_created deveria ter criado um no signup.",
    );
  }
  return membership.workspaceId;
}

/**
 * Variante para API Route Handlers: `redirect()` do next/navigation não
 * funciona ali (não faz parte da árvore de render), então erros viram
 * ApiError e a rota decide o status HTTP.
 */
export async function requireApiWorkspaceMembership(): Promise<{
  profileId: string;
  isPlatformAdmin: boolean;
  workspaceId: string;
  role: MembershipRole;
}> {
  const profile = await getCurrentProfile();
  if (!profile) throw new ApiError(401, "Não autenticado.");

  const membership = profile.memberships[0];
  if (!membership) throw new ApiError(403, "Usuário sem workspace.");

  return {
    profileId: profile.id,
    isPlatformAdmin: profile.isPlatformAdmin,
    workspaceId: membership.workspaceId,
    role: membership.role,
  };
}

/** §20 — LEITURA só consulta; TITULAR/MEMBRO e admin podem escrever. */
export function assertCanWrite(role: MembershipRole, isPlatformAdmin: boolean) {
  if (isPlatformAdmin) return;
  if (role === "LEITURA") {
    throw new ApiError(403, "Seu papel é somente leitura.");
  }
}

/** §20 — Categoria e Subcategoria são admin-only. Para usar em server actions. */
export function assertIsAdmin(isPlatformAdmin: boolean) {
  if (!isPlatformAdmin) throw new ApiError(403, "Só o administrador pode editar isso.");
}

/** Variante para Server Components (páginas admin-only inteiras). */
export async function requireAdminProfile() {
  const profile = await requireProfile();
  if (!profile.isPlatformAdmin) redirect("/painel");
  return profile;
}
