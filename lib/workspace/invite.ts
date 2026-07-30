import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { MembershipRole } from "@/app/generated/prisma/enums";

/**
 * §19.1 — convite pra um workspace existente. Sem envio de e-mail próprio:
 * gera um registro com token que o TITULAR/admin compartilha manualmente
 * (link `/convite/:token`).
 */
export async function createInvite(workspaceId: string, createdBy: string, email: string, role: MembershipRole) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new ApiError(400, "Informe um e-mail.");

  return prisma.workspaceInvite.create({
    data: { workspaceId, email: trimmed, role, createdBy },
  });
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
