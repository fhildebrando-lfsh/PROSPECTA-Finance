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
  /** Id da linha de `automation_runs` — o rastro desta execução. */
  runId: string;
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
 *
 * **Toda execução deixa rastro em `automation_runs`** (Registro Nº 091). A
 * gravação vive aqui, e não na rota, de propósito: assim não existe caminho
 * que rode sem registrar. Era exatamente esse o buraco — no Registro Nº 087,
 * "rodou e não havia nada a alertar" e "não rodou" eram indistinguíveis, e o
 * diagnóstico só saiu porque a condição de uma regra era permanente.
 *
 * A linha nasce **antes** do trabalho e é fechada depois. Os três estados
 * finais são distinguíveis de propósito:
 * - `finishedAt` preenchido e `error` nulo — correu bem;
 * - `finishedAt` preenchido e `error` presente — falhou, e a mensagem está lá;
 * - `finishedAt` **nulo** numa linha antiga — morreu no meio sem nem chegar ao
 *   `catch` (timeout, processo derrubado), que é a falha que normalmente não
 *   deixa rastro em lugar nenhum.
 */
export async function runDueAutomations(
  today: Date = new Date(),
  source: "CRON" | "MANUAL" = "CRON",
): Promise<RunAutomationsResult> {
  const run = await prisma.automationRun.create({ data: { source }, select: { id: true } });

  try {
    const result = await executarRegras(today);
    await prisma.automationRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        workspacesEvaluated: result.workspacesEvaluated,
        rulesEvaluated: result.rulesEvaluated,
        notified: result.notified,
      },
    });
    return { runId: run.id, ...result };
  } catch (err) {
    // O rastro do fracasso importa mais que o do sucesso: é o que responde
    // "por que ninguém recebeu alerta ontem?".
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), error: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}

async function executarRegras(today: Date): Promise<Omit<RunAutomationsResult, "runId">> {
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
