import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL } from "@/lib/format";
import { AutomationRulesPanel, type RuleSummary, type CategoryOption } from "./AutomationRulesPanel";
import { AssistantChat, type InteractionSummary } from "./AssistantChat";

function describeRule(trigger: string, condition: unknown): string {
  switch (trigger) {
    case "LIMIAR_CATEGORIA": {
      const c = condition as { categoryName?: string; thresholdAmount?: number; periodo?: string };
      // Sem `periodo` é regra anterior ao seletor: era mensal e continua mensal.
      const janela = c.periodo === "DIA" ? "por dia" : c.periodo === "SEMANA" ? "por semana" : "por mês";
      return `Avisar quando gastar mais de ${formatCurrencyBRL(c.thresholdAmount ?? 0)} ${janela} em ${c.categoryName ?? "categoria"}.`;
    }
    case "VENCIMENTO_PROXIMO": {
      const c = condition as { daysBefore?: number };
      return `Avisar sobre compromissos vencendo em até ${c.daysBefore ?? "?"} dia(s).`;
    }
    case "VARIACAO_RECORRENCIA": {
      const c = condition as { percentThreshold?: number };
      return `Avisar quando uma recorrência variar ${c.percentThreshold ?? "?"}% ou mais.`;
    }
    case "META_FORA_DA_TRAJETORIA":
      return "Avisar quando uma meta estiver abaixo do ritmo esperado.";
    case "INCIDENTE_ACUMULADO": {
      const c = condition as { thresholdCount?: number };
      return `Avisar quando a fila de incidentes passar de ${c.thresholdCount ?? "?"} item(ns).`;
    }
    default:
      return trigger;
  }
}

/**
 * ARQUITETURA-METODO-PROSPECTAR.md §5.5, Etapa 6 — duas peças do Max
 * vivendo numa tela só: automações (alerta via Notification, avaliado 1x/dia
 * pelo cron) e o Assistente (Q&A determinístico). Gates independentes —
 * cada seção verifica sua própria feature, então um workspace pode ter uma
 * sem a outra (ex.: PlanGrant pontual de uma feature específica).
 */
export default async function AssistentePage() {
  const workspaceId = await requireWorkspaceId();

  const [automacoes, iaAssistente] = await Promise.all([
    hasFeature(workspaceId, "automacoes"),
    hasFeature(workspaceId, "ia_assistente"),
  ]);

  if (!automacoes && !iaAssistente) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">Assistente e Automações estão disponíveis a partir do plano Max.</p>
        <p className="mt-2">
          Pergunte sobre seus números em linguagem simples e receba alertas automáticos — nunca uma execução
          financeira, sempre um aviso pra você decidir.
        </p>
      </div>
    );
  }

  const [ruleRows, despesaCategoryRows, interactionRows] = await Promise.all([
    automacoes
      ? prisma.automationRule.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    automacoes ? prisma.category.findMany({ where: { nature: "DESPESA" }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    iaAssistente
      ? prisma.aiInteraction.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 10 })
      : Promise.resolve([]),
  ]);

  const rules: RuleSummary[] = ruleRows.map((r) => ({
    id: r.id,
    trigger: r.trigger,
    isActive: r.isActive,
    description: describeRule(r.trigger, r.condition),
  }));

  const despesaCategories: CategoryOption[] = despesaCategoryRows.map((c) => ({ id: c.id, name: c.name }));

  const history: InteractionSummary[] = interactionRows.map((i) => ({
    id: i.id,
    question: i.question,
    answerText: i.answerText,
  }));

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-2xl text-sm text-zinc-500">
        Nem o Assistente nem as Automações executam nada por conta própria — só respondem perguntas com o seu dado
        real e avisam quando algo pede atenção. Recomendação de produto ou ativo específico não faz parte disso.
      </p>

      {iaAssistente && (
        <section className="flex flex-col gap-3">
          <h1 className="text-base font-medium text-zinc-100">Assistente</h1>
          <AssistantChat history={history} />
        </section>
      )}

      {automacoes && (
        <section className="flex flex-col gap-3">
          <h1 className="text-base font-medium text-zinc-100">Automações</h1>
          <p className="text-xs text-zinc-500">Avaliadas 1x por dia. Cada disparo vira um aviso — nada é feito sozinho.</p>
          <AutomationRulesPanel rules={rules} despesaCategories={despesaCategories} />
        </section>
      )}
    </div>
  );
}
