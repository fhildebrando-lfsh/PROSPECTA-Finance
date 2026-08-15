import { Decimal, type EntryNature, type EntryStatus } from "@/lib/finance/types";
import { monthRange, isWithin, daysBetween } from "@/lib/finance/dates";
import { SETTLED_STATUSES } from "@/lib/finance/derived";
import { formatCurrencyBRL } from "@/lib/format";
import type { AutomationTrigger } from "@/app/generated/prisma/enums";

/**
 * §13.8 da Metodologia PROSPECTA v5.0 (ARQUITETURA-METODO-PROSPECTAR.md §5.5,
 * Etapa 6, 2026-08-15) — motor de regras do Max. Cada função abaixo é pura:
 * recebe dado já buscado, nunca toca no Prisma. Produz só rascunhos de
 * `Notification` (`NotificationDraft`) — quem grava é o chamador impuro
 * (`app/api/cron/automations/route.ts`). Nunca cria, edita ou liquida um
 * `Entry`, nunca transfere, nunca cancela nada externamente — validado por
 * benchmark (Pierre/CloudWalk): mesmo com acesso transacional completo via
 * Open Finance, o próprio líder de mercado só alerta, nunca age sozinho.
 */
export interface NotificationDraft {
  message: string;
}

export interface AutomationEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  nature: EntryNature;
  amount: Decimal;
  dueDate: Date;
  status: EntryStatus;
  groupId: string | null;
  description: string;
}

export interface AutomationGoal {
  id: string;
  name: string;
  targetAmount: Decimal;
  targetDate: Date | null;
  createdAt: Date;
  currentBalance: Decimal;
}

// --- LIMIAR_CATEGORIA — gasto de uma categoria passou de X no mês corrente ---

export interface LimiarCategoriaCondition {
  categoryId: string;
  categoryName: string;
  thresholdAmount: number;
}

export function evaluateLimiarCategoria(
  entries: AutomationEntry[],
  condition: LimiarCategoriaCondition,
  today: Date,
): NotificationDraft | null {
  const period = monthRange(today.getUTCFullYear(), today.getUTCMonth());
  const spent = entries
    .filter(
      (e) =>
        e.categoryId === condition.categoryId &&
        e.nature === "DESPESA" &&
        SETTLED_STATUSES.has(e.status) &&
        isWithin(e.dueDate, period.start, period.end),
    )
    .reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0));

  if (spent.lessThan(condition.thresholdAmount)) return null;
  return {
    message: `Você já gastou ${formatCurrencyBRL(spent)} em ${condition.categoryName} este mês — passou do limite de ${formatCurrencyBRL(condition.thresholdAmount)}.`,
  };
}

// --- VENCIMENTO_PROXIMO — compromisso vence em N dias ---

export interface VencimentoProximoCondition {
  daysBefore: number;
}

const PENDING_FOR_DUE_ALERT = new Set<EntryStatus>(["A_PAGAR", "A_RECEBER"]);

export function evaluateVencimentoProximo(
  entries: AutomationEntry[],
  condition: VencimentoProximoCondition,
  today: Date,
): NotificationDraft | null {
  const upcoming = entries.filter((e) => {
    if (!PENDING_FOR_DUE_ALERT.has(e.status)) return false;
    const daysUntil = daysBetween(today, e.dueDate);
    return daysUntil >= 0 && daysUntil <= condition.daysBefore;
  });
  if (upcoming.length === 0) return null;

  const total = upcoming.reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0));
  return {
    message: `${upcoming.length} compromisso(s) vencendo nos próximos ${condition.daysBefore} dias, somando ${formatCurrencyBRL(total)}.`,
  };
}

// --- VARIACAO_RECORRENCIA — valor de uma recorrência mudou vs. a ocorrência anterior ---

export interface VariacaoRecorrenciaCondition {
  percentThreshold: number;
}

export function evaluateVariacaoRecorrencia(
  entries: AutomationEntry[],
  condition: VariacaoRecorrenciaCondition,
): NotificationDraft[] {
  const byGroup = new Map<string, AutomationEntry[]>();
  for (const e of entries) {
    if (!e.groupId) continue;
    const list = byGroup.get(e.groupId) ?? [];
    list.push(e);
    byGroup.set(e.groupId, list);
  }

  const drafts: NotificationDraft[] = [];
  for (const group of byGroup.values()) {
    const settled = group
      .filter((e) => SETTLED_STATUSES.has(e.status))
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
    if (settled.length < 2) continue;

    const [latest, previous] = settled;
    const previousAbs = previous.amount.abs();
    if (previousAbs.isZero()) continue;

    const latestAbs = latest.amount.abs();
    const diff = latestAbs.minus(previousAbs);
    const percentChange = diff.div(previousAbs).times(100).abs();
    if (percentChange.lessThan(condition.percentThreshold)) continue;

    const direction = diff.isPositive() ? "subiu" : "caiu";
    drafts.push({
      message: `"${latest.description}" ${direction} de ${formatCurrencyBRL(previousAbs)} para ${formatCurrencyBRL(latestAbs)}.`,
    });
  }
  return drafts;
}

// --- META_FORA_DA_TRAJETORIA — Goal abaixo do ritmo necessário pro targetDate ---

/** Tolerância antes de alertar — evita ruído por uma semana de atraso natural. */
const META_TOLERANCE = 0.9;

export function evaluateMetaForaDaTrajetoria(goals: AutomationGoal[], today: Date): NotificationDraft[] {
  const drafts: NotificationDraft[] = [];
  for (const goal of goals) {
    if (!goal.targetDate) continue;

    const totalDays = daysBetween(goal.createdAt, goal.targetDate);
    const elapsedDays = daysBetween(goal.createdAt, today);
    if (totalDays <= 0 || elapsedDays <= 0) continue;

    const expectedProgress = Math.min(1, elapsedDays / totalDays);
    const expectedAmount = goal.targetAmount.times(expectedProgress);
    if (expectedAmount.isZero()) continue;

    if (goal.currentBalance.lessThan(expectedAmount.times(META_TOLERANCE))) {
      drafts.push({
        message: `A meta "${goal.name}" está abaixo do ritmo esperado — ${formatCurrencyBRL(goal.currentBalance)} guardado(s) de um esperado de ~${formatCurrencyBRL(expectedAmount)} até agora.`,
      });
    }
  }
  return drafts;
}

// --- INCIDENTE_ACUMULADO — fila de incidentes passou de N itens ---

export interface IncidenteAcumuladoCondition {
  thresholdCount: number;
}

export function evaluateIncidenteAcumulado(
  openIncidentCount: number,
  condition: IncidenteAcumuladoCondition,
): NotificationDraft[] {
  if (openIncidentCount < condition.thresholdCount) return [];
  return [{ message: `Você tem ${openIncidentCount} lançamento(s) pendente(s) de revisão na fila de Incidentes.` }];
}

// --- Orquestrador — despacha por trigger, ainda puro (context já vem pronto do chamador) ---

export interface AutomationEvaluationContext {
  entries: AutomationEntry[];
  goals: AutomationGoal[];
  openIncidentCount: number;
  today: Date;
}

export function evaluateAutomationRule(
  rule: { trigger: AutomationTrigger; condition: unknown },
  context: AutomationEvaluationContext,
): NotificationDraft[] {
  switch (rule.trigger) {
    case "LIMIAR_CATEGORIA": {
      const draft = evaluateLimiarCategoria(context.entries, rule.condition as LimiarCategoriaCondition, context.today);
      return draft ? [draft] : [];
    }
    case "VENCIMENTO_PROXIMO": {
      const draft = evaluateVencimentoProximo(
        context.entries,
        rule.condition as VencimentoProximoCondition,
        context.today,
      );
      return draft ? [draft] : [];
    }
    case "VARIACAO_RECORRENCIA":
      return evaluateVariacaoRecorrencia(context.entries, rule.condition as VariacaoRecorrenciaCondition);
    case "META_FORA_DA_TRAJETORIA":
      return evaluateMetaForaDaTrajetoria(context.goals, context.today);
    case "INCIDENTE_ACUMULADO":
      return evaluateIncidenteAcumulado(context.openIncidentCount, rule.condition as IncidenteAcumuladoCondition);
  }
}
