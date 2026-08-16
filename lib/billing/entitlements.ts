import { prisma } from "@/lib/db/prisma";

/**
 * Resolve se um workspace tem direito a uma feature — Subscription ativa
 * (TRIALING ou ACTIVE) no Plan que a inclui, OU um Entitlement pontual não
 * expirado (override que só soma, nunca subtrai o que o plano já dá). Ver
 * ARQUITETURA-IDENTIDADE-PLANOS.md seção 9 para o racional: isto é o único
 * lugar que deve decidir "esse workspace pode usar X" — nunca checar
 * `plan.code === "..."` direto numa tela, sempre por código de feature via
 * esta função, para renomear/reprecificar plano nunca exigir tocar em tela.
 *
 * Nenhum call site usa isto ainda (Fase 2 Etapa 2 — só a peça existe e é
 * testável; nenhuma tela está "gateada" por feature nesta etapa).
 */
export async function hasFeature(workspaceId: string, featureCode: string): Promise<boolean> {
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      workspaceId,
      feature: { code: featureCode },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (entitlement) return true;

  const subscription = await prisma.subscription.findFirst({
    where: { workspaceId, status: { in: ["TRIALING", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
    include: { plan: { include: { planFeatures: { include: { feature: true } } } } },
  });
  if (!subscription) return false;

  return subscription.plan.planFeatures.some((pf) => pf.feature.code === featureCode);
}
