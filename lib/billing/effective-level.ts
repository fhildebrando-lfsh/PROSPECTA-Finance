import { prisma } from "@/lib/db/prisma";

/**
 * §4.6 da Metodologia PROSPECTA v5.0 (ARQUITETURA-METODO-PROSPECTAR.md §3,
 * Etapa 4, 2026-08-15) — camada 2 do modelo de direitos: toda `PlanGrant`
 * ativa agora (revogação nula, `now` dentro de [startsAt, endsAt]) para um
 * workspace. Pode haver mais de uma ao mesmo tempo (ex.: cortesia manual +
 * concessão de consultoria sobrepostas) — quem soma os dois é `hasFeature()`,
 * não esta função.
 */
export async function activePlanGrants(workspaceId: string, now: Date = new Date()) {
  return prisma.planGrant.findMany({
    where: {
      workspaceId,
      revokedAt: null,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    include: { plan: { include: { planFeatures: { include: { feature: true } } } } },
    orderBy: { endsAt: "desc" },
  });
}
