import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

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
