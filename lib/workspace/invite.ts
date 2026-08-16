import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { toWhatsAppDigits } from "@/lib/format";
import { hasFeature } from "@/lib/billing/entitlements";
import { activePlanGrants } from "@/lib/billing/effective-level";
import type { MembershipRole } from "@/app/generated/prisma/enums";

/** Convites novos valem por 7 dias (ARQUITETURA-IDENTIDADE-PLANOS.md §13) — antes não expiravam nunca. */
const INVITE_TTL_DAYS = 7;

/** §4.3/§9.5 da Metodologia v5.0 — Individual = 1 pessoa; Família = até 5. */
const INDIVIDUAL_SEAT_CAP = 1;
const FAMILY_SEAT_CAP = 5;
const SEAT_ROLES: MembershipRole[] = ["TITULAR", "MEMBRO", "LEITURA"];

/**
 * Etapa 4 do Método (ARQUITETURA-METODO-PROSPECTAR.md §6, 2026-08-15) —
 * enforço do teto de assento, sobre membership ACTIVE (nunca convite
 * pendente — evitaria contar a própria invite sendo aceita duas vezes).
 * Checado tanto na criação do convite (falha cedo, pra quem convida) quanto
 * no aceite (o portão de verdade — quem convida pode emitir mais convites
 * que assentos livres; só os primeiros a aceitar até o teto conseguem).
 * `ADVISOR` nunca conta como assento (consultor com acesso delegado, não
 * membro da unidade financeira, §9.5) — quem chama com essa role pula a
 * checagem inteira.
 *
 * **Sem restrição quando o workspace não tem NENHUM plano conhecido**
 * (nem Subscription ativa, nem PlanGrant ativo) — de propósito, não é
 * omissão. Nem todo workspace real hoje tem uma Subscription (o backfill de
 * `LEGACY_INTERNAL` só rodou contra o banco de dev nesta sessão, Registro Nº
 * 069 — produção nunca foi tocada). Se o teto valesse por padrão pra "sem
 * plano", cairia em `INDIVIDUAL_SEAT_CAP=1` — já "ocupado" só pelo TITULAR —
 * e travaria convite pra quem já convida gente hoje, sem nenhuma mudança de
 * plano ter acontecido. Regra: só restringe quem o negócio já classificou
 * conscientemente; ausência de dado nunca vira restrição nova.
 */
async function hasSeatAvailable(workspaceId: string): Promise<boolean> {
  const [activeSubscription, grants] = await Promise.all([
    prisma.subscription.findFirst({ where: { workspaceId, status: { in: ["TRIALING", "ACTIVE"] } } }),
    activePlanGrants(workspaceId),
  ]);
  if (!activeSubscription && grants.length === 0) return true;

  const cap = (await hasFeature(workspaceId, "multi_seat_5")) ? FAMILY_SEAT_CAP : INDIVIDUAL_SEAT_CAP;
  const activeCount = await prisma.membership.count({
    where: { workspaceId, status: "ACTIVE", role: { in: SEAT_ROLES } },
  });
  return activeCount < cap;
}

async function assertSeatAvailable(workspaceId: string) {
  if (await hasSeatAvailable(workspaceId)) return;

  const isFamily = await hasFeature(workspaceId, "multi_seat_5");
  throw new ApiError(
    403,
    isFamily
      ? `Este plano permite até ${FAMILY_SEAT_CAP} pessoas no workspace — remova alguém antes de convidar outra.`
      : `Este plano permite só 1 pessoa no workspace. Faça upgrade para o Plano Família para convidar mais gente.`,
  );
}

/**
 * §19.1 — convite para um workspace existente. Sem envio de e-mail ou
 * WhatsApp próprio: gera um registro com token que o TITULAR/admin
 * compartilha manualmente (link `/convite/:token`, com atalho para abrir o
 * WhatsApp já com a mensagem pronta quando `phone` é informado).
 */
export async function createInvite(
  workspaceId: string,
  createdBy: string,
  email: string,
  role: MembershipRole,
  phone?: string,
) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new ApiError(400, "Informe um e-mail.");

  if (role !== "ADVISOR") await assertSeatAvailable(workspaceId);

  const phoneDigits = phone ? toWhatsAppDigits(phone) : "";
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  return prisma.workspaceInvite.create({
    data: { workspaceId, email: trimmed, role, createdBy, phone: phoneDigits || null, expiresAt },
  });
}

/** Pura — separada só para ser testável sem banco. */
export function isInviteExpired(invite: { expiresAt: Date | null }, now = new Date()): boolean {
  return invite.expiresAt !== null && invite.expiresAt.getTime() < now.getTime();
}

/**
 * [LIMITAÇÃO CONHECIDA] não existe seletor de workspace ainda — se quem
 * aceita já tinha uma conta (e portanto já tem seu próprio workspace
 * "pessoal" criado no signup), esta membership é só adicionada; o app
 * continua mostrando `memberships[0]` como padrão, não necessariamente esta.
 */
export async function acceptInvite(token: string, profileId: string, profileEmail: string | null | undefined) {
  const invite = await prisma.workspaceInvite.findUnique({ where: { token } });
  if (!invite) throw new ApiError(404, "Convite não encontrado.");
  if (invite.acceptedAt) throw new ApiError(400, "Este convite já foi aceito.");
  if (isInviteExpired(invite)) throw new ApiError(400, "Este convite expirou.");
  if (!profileEmail || profileEmail.trim().toLowerCase() !== invite.email) {
    throw new ApiError(403, `Este convite foi enviado para ${invite.email} — entre com essa conta para aceitar.`);
  }

  const existing = await prisma.membership.findUnique({
    where: { workspaceId_profileId: { workspaceId: invite.workspaceId, profileId } },
  });
  if (existing) {
    await prisma.workspaceInvite.update({ where: { token }, data: { acceptedAt: new Date() } });
    return existing;
  }

  if (invite.role !== "ADVISOR") await assertSeatAvailable(invite.workspaceId);

  const [membership] = await prisma.$transaction([
    prisma.membership.create({ data: { workspaceId: invite.workspaceId, profileId, role: invite.role } }),
    prisma.workspaceInvite.update({ where: { token }, data: { acceptedAt: new Date() } }),
  ]);
  return membership;
}

/**
 * Rede de segurança para o caso de convite (cliente ou membro) para um e-mail que
 * **já tem conta**. O trigger `handle_new_auth_user()` só roda em signup —
 * quando a pessoa já existe e só faz login de novo (magic link, ou Google
 * OAuth para um e-mail já cadastrado), ele nunca dispara, então o convite
 * pendente nunca seria aceito sozinho. Chamado de `/auth/confirm` depois de
 * qualquer login bem-sucedido — idempotente (se não houver convite pendente,
 * ou a Membership já existir por algum outro caminho, não faz nada).
 */
export async function acceptPendingInviteForEmail(profileId: string, email: string) {
  const trimmed = email.trim().toLowerCase();
  const invite = await prisma.workspaceInvite.findFirst({
    where: { email: trimmed, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!invite || isInviteExpired(invite)) return;

  const existing = await prisma.membership.findUnique({
    where: { workspaceId_profileId: { workspaceId: invite.workspaceId, profileId } },
  });
  if (existing) {
    await prisma.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return;
  }

  // Nunca lança — esta função roda em silêncio depois de qualquer login
  // (§ comentário acima). Se o workspace estiver sem assento livre, o
  // convite fica pendente sem aceitar (o TITULAR resolve depois) em vez de
  // quebrar o login de alguém por causa de um convite alheio.
  if (invite.role !== "ADVISOR" && !(await hasSeatAvailable(invite.workspaceId))) return;

  await prisma.$transaction([
    prisma.membership.create({ data: { workspaceId: invite.workspaceId, profileId, role: invite.role } }),
    prisma.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
}
