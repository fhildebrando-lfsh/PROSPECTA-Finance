import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { walletBalance } from "@/lib/finance/balance";
import { entryIncidents } from "@/lib/finance/incidents";
import {
  evaluateAutomationRule,
  type AutomationEntry,
  type AutomationEvaluationContext,
  type AutomationGoal,
} from "@/lib/method/automation-engine";

export interface RunAutomationsResult {
  workspacesEvaluated: number;
  rulesEvaluated: number;
  notified: number;
}

/**
 * ARQUITETURA-METODO-PROSPECTAR.md §5.5.1, Etapa 6 — impuro (busca dado real,
 * grava `Notification`), chamado pela rota de cron
 * (`app/api/cron/automations/route.ts`). Fica em `lib/method/` (não na rota)
 * pra ser testável direto contra o banco de dev, mesmo padrão de
 * `lib/method/reconciliation.ts`. Nunca cria, edita ou liquida um `Entry`,
 * nunca transfere, nunca cancela nada — só produz alertas.
 */
export async function runDueAutomations(today: Date = new Date()): Promise<RunAutomationsResult> {
  const rules = await prisma.automationRule.findMany({
    where: { isActive: true },
    select: { id: true, workspaceId: true, trigger: true, condition: true },
  });

  const rulesByWorkspace = new Map<string, typeof rules>();
  for (const rule of rules) {
    const list = rulesByWorkspace.get(rule.workspaceId) ?? [];
    list.push(rule);
    rulesByWorkspace.set(rule.workspaceId, list);
  }

  let notifiedCount = 0;

  for (const [workspaceId, workspaceRules] of rulesByWorkspace) {
    const [entryRows, goalRows] = await Promise.all([
      prisma.entry.findMany({
        where: { workspaceId },
        select: {
          id: true,
          walletId: true,
          categoryId: true,
          category: { select: { name: true } },
          nature: true,
          amount: true,
          transactionDate: true,
          dueDate: true,
          statusCode: true,
          recurrenceCode: true,
          isFixedOverride: true,
          groupId: true,
          description: true,
          installmentNumber: true,
          installmentTotal: true,
          incidentAcknowledgedAt: true,
          autoReviewReason: true,
        },
      }),
      prisma.goal.findMany({
        where: { workspaceId, isActive: true, targetDate: { not: null } },
        select: { id: true, name: true, walletId: true, targetAmount: true, targetDate: true, createdAt: true },
      }),
    ]);

    const financeEntries = entryRows.map(toFinanceEntry);

    const automationEntries: AutomationEntry[] = entryRows.map((e) => ({
      id: e.id,
      categoryId: e.categoryId,
      categoryName: e.category.name,
      nature: e.nature,
      amount: e.amount,
      dueDate: e.dueDate,
      status: e.statusCode as AutomationEntry["status"],
      groupId: e.groupId,
      description: e.description,
    }));

    const goals: AutomationGoal[] = goalRows.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      createdAt: g.createdAt,
      currentBalance: walletBalance(financeEntries, g.walletId, today),
    }));

    const context: AutomationEvaluationContext = {
      entries: automationEntries,
      goals,
      openIncidentCount: entryIncidents(entryRows).length,
      today,
    };

    const notificationsToCreate = workspaceRules.flatMap((rule) =>
      evaluateAutomationRule({ trigger: rule.trigger, condition: rule.condition }, context).map((draft) => ({
        workspaceId,
        visibility: "SHARED" as const,
        severity: "alerta_automacao",
        message: draft.message,
      })),
    );

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({ data: notificationsToCreate });
      notifiedCount += notificationsToCreate.length;
    }
  }

  return { workspacesEvaluated: rulesByWorkspace.size, rulesEvaluated: rules.length, notified: notifiedCount };
}
