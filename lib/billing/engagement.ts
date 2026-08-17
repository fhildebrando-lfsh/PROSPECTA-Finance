import { prisma } from "@/lib/db/prisma";
import type { ConsultingEngagement } from "@/app/generated/prisma/client";

/**
 * Etapa 8 — camada 3 do modelo de direitos (§4.6): o contrato de consultoria.
 *
 * `Subscription` diz o que foi **contratado comercialmente**; `PlanGrant` é
 * **elevação temporária**; `ConsultingEngagement` é o que só existe **com um
 * consultor ativo por trás**. As features de `gateKind = METODO` dependem desta
 * camada e de mais nada — §3.1 da Metodologia v5.0 é explícito: "PIP autogerada
 * é recomendação disfarçada". Dinheiro de assinatura não compra método.
 */

/**
 * O contrato ativo de um workspace, se houver. Ativo = `status = ATIVO`, já
 * começou, e ou não tem fim ou o fim ainda não chegou.
 *
 * A regra "nunca mais de um ATIVO por vez" é de aplicação, não de schema
 * (mesmo padrão de `Subscription`) — aqui devolvemos o mais recente, para que
 * um dado inconsistente degrade de forma previsível em vez de explodir.
 */
export async function activeEngagement(
  workspaceId: string,
  now = new Date(),
): Promise<ConsultingEngagement | null> {
  return prisma.consultingEngagement.findFirst({
    where: {
      workspaceId,
      status: "ATIVO",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { startsAt: "desc" },
  });
}

/**
 * §13.8 — um contrato de modalidade `PROJETO` libera **apenas a fase que ele
 * contratou**, não a camada de método inteira. As demais modalidades
 * (diagnóstico, planejamento, acompanhamento) liberam a camada toda enquanto
 * estiverem ativas.
 *
 * `featurePhase` nulo significa **transversal**: a feature é andaime da própria
 * camada de método — a trilha, os gates, o acesso do consultor, os entregáveis
 * —, e todo contrato precisa dela para o trabalho existir. Sem a trilha, um
 * cliente de Projeto não consegue nem ver em que ponto está.
 *
 * **A versão anterior tratava nulo como "não coberta"**, e o resultado foi um
 * defeito silencioso encontrado em produção em 2026-08-17: como **nenhuma**
 * feature tinha fase preenchida, um contrato de Projeto liberava **zero**
 * features — a modalidade era vendável e não entregava nada, enquanto a tela
 * dizia "não há consultoria ativa" com uma consultoria ativa.
 *
 * A inversão só é segura porque a fase de cada feature agora é decisão
 * explícita em `prisma/seed-plans.ts`, e um teste exige que o mapa cubra todas
 * as features de método. Feature nova sem decisão quebra o teste em vez de
 * virar acesso de graça.
 */
export function engagementCoversFeature(engagement: ConsultingEngagement, featurePhase: number | null): boolean {
  if (engagement.modality !== "PROJETO") return true;
  if (featurePhase === null) return true;
  if (engagement.projectPhase === null) return false;
  return engagement.projectPhase === featurePhase;
}

/**
 * Encerra o contrato ativo, se houver. Nunca apaga — o histórico de quem
 * acompanhou quem, e quando, é a auditoria da consultoria.
 */
export async function closeActiveEngagement(workspaceId: string, status: "CONCLUIDO" | "CANCELADO", now = new Date()) {
  const ativo = await activeEngagement(workspaceId, now);
  if (!ativo) return null;
  return prisma.consultingEngagement.update({
    where: { id: ativo.id },
    data: { status, endsAt: now },
  });
}
