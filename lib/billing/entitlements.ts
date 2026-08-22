import { prisma } from "@/lib/db/prisma";
import { activePlanGrants } from "./effective-level";
import { activeEngagement, engagementCoversFeature } from "./engagement";

/**
 * Resolve se um workspace tem direito a uma feature. Ver
 * ARQUITETURA-IDENTIDADE-PLANOS.md seção 9 para o racional geral: isto é o
 * único lugar que deve decidir "esse workspace pode usar X" — nunca checar
 * `plan.code === "..."` direto numa tela, sempre por código de feature via
 * esta função, para renomear/reprecificar plano nunca exigir tocar em tela.
 *
 * Desde a Etapa 3 do Método (ARQUITETURA-METODO-PROSPECTAR.md §3/5.2,
 * 2026-08-15), o caminho se bifurca por `Feature.gateKind`:
 * - `METODO` — reservado às features do Método PROSPECTAR (§13.8), que só
 *   fazem sentido com um consultor ativo, nunca por dinheiro de assinatura
 *   sozinho (§3.1 da Metodologia v5.0: "PIP autogerada é recomendação
 *   disfarçada"). Resolvido por `ConsultingEngagement`, que ainda não existe
 *   (Etapa 8) — até lá, toda feature METODO retorna `false` para todo mundo,
 *   de propósito (fail-safe: nenhuma feature de método vaza por engano
 *   enquanto a camada que deveria concedê-la não existe).
 * - `PLANO` (default) — três fontes, qualquer uma libera: (1) Entitlement
 *   pontual não expirado; (2) Subscription ativa (TRIALING ou ACTIVE) no
 *   Plan que inclui a feature; (3) desde a Etapa 4 (§4.6, 2026-08-15),
 *   qualquer `PlanGrant` ativo agora cujo Plan inclua a feature — a camada 2
 *   do modelo de direitos, elevação temporária por consultoria (ou cortesia
 *   manual do admin), que nunca escreve na Subscription do cliente.
 *
 * Primeiras telas gateadas por esta função: Etapa 3 (2026-08-15) — ver
 * `app/(app)/relatorios/regua/page.tsx` (feature `regua_posicao`).
 */
export async function hasFeature(workspaceId: string, featureCode: string): Promise<boolean> {
  const feature = await prisma.feature.findUnique({ where: { code: featureCode } });
  if (!feature) return false; // código inexistente no catálogo — nunca libera por engano

  /**
   * Etapa 8 (2026-08-17) — a camada de método passou a existir.
   *
   * Antes disto, toda feature METODO devolvia `false` para todo mundo, de
   * propósito (fail-safe enquanto a camada que deveria concedê-las não
   * existia). Agora resolve por `ConsultingEngagement` ativo — e **só** por
   * ele: nem Subscription, nem PlanGrant, nem Entitlement liberam método.
   * §3.1 da Metodologia v5.0 é a razão ("PIP autogerada é recomendação
   * disfarçada"): o que exige um profissional por trás não pode ser comprado
   * como assinatura.
   *
   * Note que o caminho não cai para as três fontes de baixo — ele retorna
   * aqui, decidido. Um workspace com Max e sem consultor continua sem método.
   */
  if (feature.gateKind === "METODO") {
    const engagement = await activeEngagement(workspaceId);
    if (!engagement) return false;
    return engagementCoversFeature(engagement, feature.methodPhase);
  }

  /**
   * Camada de **exceção pontual** (§4.6): libera uma feature avulsa para um
   * workspace, sem mexer no plano dele.
   *
   * **Não existe tela que crie um `Entitlement`** — hoje ele é operado por SQL
   * direto, e isso é escotilha deliberada, não lacuna: é o recurso para um caso
   * único que não justifica alterar o catálogo comercial nem conceder um plano
   * inteiro. A revisão de 2026-08-18 chegou a classificá-lo como código morto;
   * a classificação estava errada — o mecanismo funciona e é coberto por dois
   * testes de integração (`tests/integration/billing/entitlements.test.ts`).
   *
   * Se um dia isto ganhar tela, o lugar natural é `/admin/usuarios`, ao lado da
   * concessão temporária de plano.
   */
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
  if (subscription?.plan.planFeatures.some((pf) => pf.feature.code === featureCode)) return true;

  const grants = await activePlanGrants(workspaceId);
  return grants.some((g) => g.plan.planFeatures.some((pf) => pf.feature.code === featureCode));
}
