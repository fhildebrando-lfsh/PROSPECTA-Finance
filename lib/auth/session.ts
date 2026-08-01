import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { logAccess } from "@/lib/audit/access-log";
import type { MembershipRole, PlatformRole } from "@/app/generated/prisma/enums";

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
  platformRole: PlatformRole;
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
    platformRole: profile.platformRole,
    workspaceId: membership.workspaceId,
    role: membership.role,
  };
}

/**
 * Variante explícita de workspace — diferente de `requireWorkspaceId()`
 * (que sempre assume `memberships[0]`), recebe o `workspaceId` de fora e
 * valida contra as memberships **reais** da sessão (nunca confia cegamente
 * no valor recebido). É a peça que um seletor de workspace (ainda não
 * construído — Fase 2 Etapa 3+) vai usar pra deixar a mesma pessoa
 * acessar, por exemplo, um workspace onde ela é ADVISOR em vez do seu
 * workspace pessoal. Sem seletor nenhum ainda, nenhum call site usa isto —
 * existe pronto pra quando existir.
 *
 * Acesso como ADVISOR é registrado em `AccessLog` (§19.1 da especificação:
 * "todo acesso de administrador/consultor a workspace de terceiro é
 * registrado"). Acesso de PLATFORM_ADMIN a um workspace onde ele **não**
 * tem Membership nenhuma (o "admin acessa qualquer workspace" completo do
 * §19.1) ainda não está implementado aqui de propósito — é um recurso
 * maior, com sua própria tela/fluxo, que fica pra quando for de fato
 * encomendado; hoje `/admin/usuarios` já cobre a necessidade atual sem
 * precisar disso (usa a Admin API do Supabase, não Membership).
 */
export async function requireMembershipForWorkspace(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId && m.status === "ACTIVE");

  if (!membership) {
    throw new ApiError(403, "Sem acesso a este workspace.");
  }

  if (membership.role === "ADVISOR") {
    await logAccess({
      actorProfileId: profile.id,
      workspaceId,
      actorRole: membership.role,
      action: "VIEW_WORKSPACE",
    });
  }

  return { profile, membership };
}

/**
 * Ações que o `can()` abaixo sabe decidir. Cresce conforme a Arquitetura de
 * Identidade/Planos (ver ARQUITETURA-IDENTIDADE-PLANOS.md seção 8) precisar
 * de novas regras — `assertCanWrite`/`assertIsAdmin` continuam sendo a
 * forma que o resto do código já usa, agora implementadas em cima disto.
 */
export type Action = "write" | "manageTaxonomy";

export interface AuthContext {
  platformRole: PlatformRole;
  /** Ausente pra decisões que não dependem de papel de workspace (ex.: `manageTaxonomy`). */
  role?: MembershipRole;
}

function toPlatformRole(isPlatformAdmin: boolean): PlatformRole {
  return isPlatformAdmin ? "PLATFORM_ADMIN" : "NONE";
}

/**
 * Função explícita de autorização (RBAC), não um motor genérico configurável
 * — ver seção 8 do documento de arquitetura pro porquê. Combina só o papel
 * de workspace + o papel de plataforma; nunca decide nada de plano/feature
 * aqui (isso é `lib/billing/entitlements.ts::hasFeature()`, checado à parte
 * — autorização e comercial são perguntas diferentes, feitas em lugares
 * diferentes, de propósito).
 */
export function can(action: Action, ctx: AuthContext): boolean {
  if (ctx.platformRole === "PLATFORM_ADMIN") return true;

  switch (action) {
    case "write":
      return ctx.role !== undefined && ctx.role !== "LEITURA";
    case "manageTaxonomy":
      return false; // só admin, já coberto acima
  }
}

/**
 * §20 — LEITURA só consulta; TITULAR/MEMBRO/ADVISOR e admin podem escrever.
 * Mesma assinatura de sempre — call sites existentes não mudam nada.
 */
export function assertCanWrite(role: MembershipRole, isPlatformAdmin: boolean) {
  if (!can("write", { role, platformRole: toPlatformRole(isPlatformAdmin) })) {
    throw new ApiError(403, "Seu papel é somente leitura.");
  }
}

/**
 * §20 — Categoria e Tipo (e editar/arquivar Subcategoria) são admin-only.
 * Mesma assinatura de sempre — call sites existentes não mudam nada.
 */
export function assertIsAdmin(isPlatformAdmin: boolean) {
  if (!can("manageTaxonomy", { platformRole: toPlatformRole(isPlatformAdmin) })) {
    throw new ApiError(403, "Só o administrador pode editar isso.");
  }
}

/** Variante para Server Components (páginas admin-only inteiras). */
export async function requireAdminProfile() {
  const profile = await requireProfile();
  if (!profile.isPlatformAdmin) redirect("/painel");
  return profile;
}
