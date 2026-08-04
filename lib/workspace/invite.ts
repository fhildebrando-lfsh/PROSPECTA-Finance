import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { toWhatsAppDigits } from "@/lib/format";
import type { MembershipRole } from "@/app/generated/prisma/enums";

/** Convites novos valem por 7 dias (ARQUITETURA-IDENTIDADE-PLANOS.md §13) — antes não expiravam nunca. */
const INVITE_TTL_DAYS = 7;

/**
 * §19.1 — convite pra um workspace existente. Sem envio de e-mail ou
 * WhatsApp próprio: gera um registro com token que o TITULAR/admin
 * compartilha manualmente (link `/convite/:token`, com atalho pra abrir o
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

  const phoneDigits = phone ? toWhatsAppDigits(phone) : "";
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  return prisma.workspaceInvite.create({
    data: { workspaceId, email: trimmed, role, createdBy, phone: phoneDigits || null, expiresAt },
  });
}

/** Pura — separada só pra ser testável sem banco. */
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

  const [membership] = await prisma.$transaction([
    prisma.membership.create({ data: { workspaceId: invite.workspaceId, profileId, role: invite.role } }),
    prisma.workspaceInvite.update({ where: { token }, data: { acceptedAt: new Date() } }),
  ]);
  return membership;
}
