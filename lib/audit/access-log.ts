import { prisma } from "@/lib/db/prisma";
import type { MembershipRole } from "@/app/generated/prisma/enums";

/**
 * Registro de acesso a um workspace que não é o do próprio ator (ADVISOR
 * ou platform admin — ver ARQUITETURA-IDENTIDADE-PLANOS.md seção 11).
 * Nunca chamado para acesso do próprio OWNER/MEMBER/VIEWER ao seu workspace
 * (seria ruído, não auditoria) — quem decide isso é o chamador
 * (`lib/auth/session.ts::requireMembershipForWorkspace`), não esta função.
 * Granularidade por rota/ação nesta fase, não por campo.
 */
export async function logAccess(params: {
  actorProfileId: string;
  workspaceId: string;
  actorRole: MembershipRole;
  action: string;
}) {
  await prisma.accessLog.create({ data: params });
}
