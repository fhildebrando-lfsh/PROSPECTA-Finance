import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { logAccess } from "@/lib/audit/access-log";
import type { MembershipRole, MembershipStatus, PlatformRole } from "@/app/generated/prisma/enums";

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

/**
 * Cookie que guarda qual workspace a pessoa escolheu ver (Arquitetura de
 * Identidade/Planos, Fase 2 Etapa 3 — seletor de workspace). Só passa a
 * existir quando alguém troca de workspace pelo menos uma vez
 * (`lib/workspace/switch.ts::setActiveWorkspace`); sem cookie, o
 * comportamento é idêntico ao de sempre (primeira membership).
 */
export const ACTIVE_WORKSPACE_COOKIE = "active_workspace_id";

interface MembershipLike {
  workspaceId: string;
  status: MembershipStatus;
  role: MembershipRole;
}

/**
 * Pura, sem I/O — decide qual Membership é "a ativa" para a sessão atual.
 * `requestedWorkspaceId` (vindo do cookie) só vale se apontar para uma
 * Membership `ACTIVE` de verdade da própria pessoa; caso contrário (cookie
 * ausente, revogado, ou de outra pessoa) cai no comportamento de sempre —
 * a primeira membership. Nunca confia no valor sem checar contra a lista
 * real de memberships da sessão.
 */
export function resolveActiveMembership<T extends MembershipLike>(
  memberships: T[],
  requestedWorkspaceId?: string,
): T | undefined {
  const active = memberships.filter((m) => m.status === "ACTIVE");
  if (requestedWorkspaceId) {
    const requested = active.find((m) => m.workspaceId === requestedWorkspaceId);
    if (requested) return requested;
  }
  return active[0];
}

/**
 * Resolve perfil + a Membership ativa da sessão (via cookie, com fallback
 * para a primeira membership — ver `resolveActiveMembership`). Registra
 * `AccessLog` quando a Membership resolvida é `ADVISOR` (§19.1 — acesso de
 * consultor a workspace de terceiro é sempre auditado). Usado tanto por
 * `requireWorkspaceId()` quanto pelo layout, que precisa do objeto
 * completo (nome do workspace, papel) para desenhar o seletor.
 */
export async function requireActiveMembership() {
  const profile = await requireProfile();

  // LGPD — trava a entrada no app para quem nunca aceitou a Política de
  // Privacidade: contas criadas via Google (não passa pelo checkbox do
  // cadastro por e-mail) e contas antigas de antes deste campo existir.
  // Fica aqui (não em requireProfile) de propósito — /definir-senha e outras
  // etapas de onboarding também chamam requireProfile() e não devem cair
  // nessa trava no meio do fluxo.
  if (!profile.privacyPolicyAcceptedAt) redirect("/aceitar-politica");

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const membership = resolveActiveMembership(profile.memberships, requested);

  if (!membership) {
    throw new Error(
      "Usuário autenticado sem workspace. O trigger on_auth_user_created deveria ter criado um no signup.",
    );
  }

  // Bloqueio de acesso (admin-only, ver lib/workspace/block.ts) — pausa reversível de
  // TODO mundo que acessa este workspace, alternativa a excluir a conta do cliente.
  // Mesmo mecanismo do gate de LGPD acima: cobre a `(app)` inteira de graça, porque
  // `app/(app)/layout.tsx` chama esta função uma vez no topo da árvore.
  if (membership.workspace.blockedAt) redirect("/acesso-bloqueado");

  if (membership.role === "ADVISOR") {
    await logAccess({
      actorProfileId: profile.id,
      workspaceId: membership.workspaceId,
      actorRole: membership.role,
      action: "VIEW_WORKSPACE",
    });
  }

  return { profile, membership };
}

/** Workspace ativo do usuário — ver `requireActiveMembership()`. */
export async function requireWorkspaceId() {
  const { membership } = await requireActiveMembership();
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
  advisorCanWrite: boolean;
}> {
  const profile = await getCurrentProfile();
  if (!profile) throw new ApiError(401, "Não autenticado.");

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const membership = resolveActiveMembership(profile.memberships, requested);
  if (!membership) throw new ApiError(403, "Usuário sem workspace.");

  // Mesmo bloqueio de `requireActiveMembership()` — aqui não dá pra `redirect()` (rota de
  // API), então vira 403. Sem isso, PDFs/exports de um workspace bloqueado continuariam
  // funcionando mesmo com a tela principal barrada.
  if (membership.workspace.blockedAt) throw new ApiError(403, "O acesso a este workspace está pausado.");

  if (membership.role === "ADVISOR") {
    await logAccess({
      actorProfileId: profile.id,
      workspaceId: membership.workspaceId,
      actorRole: membership.role,
      action: "VIEW_WORKSPACE",
    });
  }

  return {
    profileId: profile.id,
    isPlatformAdmin: profile.isPlatformAdmin,
    platformRole: profile.platformRole,
    workspaceId: membership.workspaceId,
    role: membership.role,
    advisorCanWrite: membership.advisorCanWrite,
  };
}

/**
 * Variante explícita de workspace — diferente de `requireWorkspaceId()`
 * (que sempre assume `memberships[0]`), recebe o `workspaceId` de fora e
 * valida contra as memberships **reais** da sessão (nunca confia cegamente
 * no valor recebido). É a peça que um seletor de workspace (ainda não
 * construído — Fase 2 Etapa 3+) vai usar para deixar a mesma pessoa
 * acessar, por exemplo, um workspace onde ela é ADVISOR em vez do seu
 * workspace pessoal. Sem seletor nenhum ainda, nenhum call site usa isto —
 * existe pronto para quando existir.
 *
 * Acesso como ADVISOR é registrado em `AccessLog` (§19.1 da especificação:
 * "todo acesso de administrador/consultor a workspace de terceiro é
 * registrado"). Acesso de PLATFORM_ADMIN a um workspace onde ele **não**
 * tem Membership nenhuma (o "admin acessa qualquer workspace" completo do
 * §19.1) ainda não está implementado aqui de propósito — é um recurso
 * maior, com sua própria tela/fluxo, que fica para quando for de fato
 * encomendado; hoje `/admin/usuarios` já cobre a necessidade atual sem
 * precisar disso (usa a Admin API do Supabase, não Membership).
 */
export async function requireMembershipForWorkspace(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId && m.status === "ACTIVE");

  if (!membership) {
    throw new ApiError(403, "Sem acesso a este workspace.");
  }

  // Mesmo bloqueio de `requireActiveMembership()`/`requireApiWorkspaceMembership()` — por
  // completude, já que esta função existe pronta pra um seletor de workspace futuro.
  if (membership.workspace.blockedAt) throw new ApiError(403, "O acesso a este workspace está pausado.");

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
  /** Ausente para decisões que não dependem de papel de workspace (ex.: `manageTaxonomy`). */
  role?: MembershipRole;
  /**
   * Só relevante quando role = ADVISOR (2026-08-15, Etapa 0 — ver
   * ARQUITETURA-METODO-PROSPECTAR.md §3.2/5.7). Ausente/false = sem escrita,
   * o padrão seguro — ausência nunca é lida como permissão.
   */
  advisorCanWrite?: boolean;
}

function toPlatformRole(isPlatformAdmin: boolean): PlatformRole {
  return isPlatformAdmin ? "PLATFORM_ADMIN" : "NONE";
}

/**
 * Função explícita de autorização (RBAC), não um motor genérico configurável
 * — ver seção 8 do documento de arquitetura para o porquê. Combina só o papel
 * de workspace + o papel de plataforma; nunca decide nada de plano/feature
 * aqui (isso é `lib/billing/entitlements.ts::hasFeature()`, checado à parte
 * — autorização e comercial são perguntas diferentes, feitas em lugares
 * diferentes, de propósito).
 */
export function can(action: Action, ctx: AuthContext): boolean {
  if (ctx.platformRole === "PLATFORM_ADMIN") return true;

  switch (action) {
    case "write":
      if (ctx.role === undefined || ctx.role === "LEITURA") return false;
      // 2026-08-15 — ADVISOR não tem mais escrita automática (Etapa 0):
      // exige concessão explícita do TITULAR, nunca herdada só do papel.
      if (ctx.role === "ADVISOR") return ctx.advisorCanWrite === true;
      return true;
    case "manageTaxonomy":
      return false; // só admin, já coberto acima
  }
}

/**
 * §20 — LEITURA só consulta; TITULAR/MEMBRO e admin sempre podem escrever;
 * ADVISOR só com `advisorCanWrite` concedido explicitamente (Etapa 0,
 * 2026-08-15 — antes disso ADVISOR escrevia igual a MEMBRO, sem concessão).
 * Parâmetro obrigatório de propósito, sem default — mesmo padrão já usado em
 * `periodTotals(settlement)`: o compilador aponta todo call site que precisa
 * ser revisado em vez de herdar em silêncio um valor errado.
 */
export function assertCanWrite(role: MembershipRole, isPlatformAdmin: boolean, advisorCanWrite: boolean) {
  if (!can("write", { role, platformRole: toPlatformRole(isPlatformAdmin), advisorCanWrite })) {
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
