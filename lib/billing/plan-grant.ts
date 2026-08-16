import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";

/**
 * §4.6 da Metodologia PROSPECTA v5.0 (ARQUITETURA-METODO-PROSPECTAR.md §3,
 * Etapa 4, 2026-08-15) — concede uma elevação temporária de nível. Sem
 * `ConsultingEngagement` ainda (Etapa 8), toda concessão nasce manual — o
 * admin escolhe o motivo (ex.: cortesia, teste, acesso antecipado).
 * `Subscription` do workspace nunca é tocada aqui — regra central do
 * modelo de três camadas.
 */
export async function grantPlan(params: {
  workspaceId: string;
  planId: string;
  reason: string;
  endsAt: Date;
  createdBy: string;
}) {
  if (params.endsAt.getTime() <= Date.now()) {
    throw new ApiError(400, "A data de término precisa ser no futuro.");
  }

  return prisma.planGrant.create({
    data: {
      workspaceId: params.workspaceId,
      planId: params.planId,
      reason: params.reason,
      startsAt: new Date(),
      endsAt: params.endsAt,
      createdBy: params.createdBy,
    },
  });
}

/** Revoga antes do fim natural — nunca DELETE, mesmo espírito de Membership.status/revokedAt. */
export async function revokePlanGrant(grantId: string) {
  await prisma.planGrant.update({ where: { id: grantId }, data: { revokedAt: new Date() } });
}
