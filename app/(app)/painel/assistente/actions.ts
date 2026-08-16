"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { walletBalance } from "@/lib/finance/balance";
import { entryIncidents } from "@/lib/finance/incidents";
import { answerQuestion, type AiAssistantContext } from "@/lib/method/ai-assistant";
import type { AutomationTrigger } from "@/app/generated/prisma/enums";

async function currentMembership(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  return {
    profileId: profile.id,
    role: membership.role,
    isPlatformAdmin: profile.isPlatformAdmin,
    advisorCanWrite: membership.advisorCanWrite,
  };
}

/**
 * ARQUITETURA-METODO-PROSPECTAR.md §5.5, Etapa 6 — cada `trigger` tem sua
 * própria forma de `condition` (documentada em `lib/method/automation-engine.ts`).
 * Catálogo pequeno e fixo de "templates" em vez de um editor de regra livre —
 * mesmo espírito do Assistente (Q&A por casamento de padrão, não uma UI
 * genérica que aceitaria qualquer coisa).
 */
function buildCondition(trigger: AutomationTrigger, formData: FormData, categoryName?: string): object {
  switch (trigger) {
    case "LIMIAR_CATEGORIA": {
      const categoryId = String(formData.get("categoryId") ?? "");
      const thresholdAmount = Number(formData.get("thresholdAmount"));
      if (!categoryId || !categoryName) throw new Error("Escolha uma categoria.");
      if (!(thresholdAmount > 0)) throw new Error("Informe um valor de limite maior que zero.");
      return { categoryId, categoryName, thresholdAmount };
    }
    case "VENCIMENTO_PROXIMO": {
      const daysBefore = Number(formData.get("daysBefore"));
      if (!(daysBefore > 0)) throw new Error("Informe quantos dias antes do vencimento.");
      return { daysBefore };
    }
    case "VARIACAO_RECORRENCIA": {
      const percentThreshold = Number(formData.get("percentThreshold"));
      if (!(percentThreshold > 0)) throw new Error("Informe um percentual de variação maior que zero.");
      return { percentThreshold };
    }
    case "META_FORA_DA_TRAJETORIA":
      return {};
    case "INCIDENTE_ACUMULADO": {
      const thresholdCount = Number(formData.get("thresholdCount"));
      if (!(thresholdCount > 0)) throw new Error("Informe a partir de quantos incidentes avisar.");
      return { thresholdCount };
    }
  }
}

export async function createAutomationRule(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);
  if (!(await hasFeature(workspaceId, "automacoes"))) throw new Error("Automações estão disponíveis a partir do plano Max.");

  const trigger = String(formData.get("trigger") ?? "") as AutomationTrigger;

  let categoryName: string | undefined;
  if (trigger === "LIMIAR_CATEGORIA") {
    const categoryId = String(formData.get("categoryId") ?? "");
    const category = categoryId ? await prisma.category.findUnique({ where: { id: categoryId } }) : null;
    categoryName = category?.name;
  }

  const condition = buildCondition(trigger, formData, categoryName);

  await prisma.automationRule.create({
    data: { workspaceId, trigger, condition, createdBy: profileId },
  });

  revalidatePath("/painel/assistente");
}

export async function toggleAutomationRule(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";
  await prisma.automationRule.update({ where: { id, workspaceId }, data: { isActive: !isActive } });

  revalidatePath("/painel/assistente");
}

export async function deleteAutomationRule(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  await prisma.automationRule.delete({ where: { id, workspaceId } });

  revalidatePath("/painel/assistente");
}

export interface AskAssistantState {
  question: string | null;
  answerText: string | null;
  error: string | null;
}

/**
 * Pergunta em linguagem natural → `answerQuestion` (puro, casamento de
 * padrão) → resposta auditável (`AiInteraction.answerQuery` grava a consulta
 * estruturada que gerou a resposta, nunca só o texto solto). Sem checagem de
 * `assertCanWrite` de propósito: perguntar é leitura, qualquer papel com
 * acesso ao workspace pode usar (mesmo LEITURA/ADVISOR sem concessão).
 */
export async function askAssistant(_prevState: AskAssistantState, formData: FormData): Promise<AskAssistantState> {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "ia_assistente"))) {
    return { question: null, answerText: null, error: "O Assistente de IA está disponível a partir do plano Max." };
  }

  const question = String(formData.get("question") ?? "").trim();
  if (!question) return { question: null, answerText: null, error: "Digite uma pergunta." };

  const [entryRows, wallets, categories, goals] = await Promise.all([
    prisma.entry.findMany({
      where: { workspaceId },
      select: {
        id: true,
        walletId: true,
        categoryId: true,
        nature: true,
        amount: true,
        transactionDate: true,
        dueDate: true,
        statusCode: true,
        recurrenceCode: true,
        isFixedOverride: true,
        groupId: true,
        installmentNumber: true,
        installmentTotal: true,
        incidentAcknowledgedAt: true,
        autoReviewReason: true,
      },
    }),
    prisma.wallet.findMany({ where: { workspaceId, isActive: true }, select: { id: true, kindCode: true } }),
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.goal.findMany({
      where: { workspaceId, isActive: true },
      select: { id: true, name: true, walletId: true, targetAmount: true },
    }),
  ]);

  const financeEntries = entryRows.map(toFinanceEntry);
  const today = new Date();

  // Não há um campo dedicado "meta de reserva" no modelo Goal — identifica
  // pelo nome, mesma convenção que o usuário já usa em Patrimônio → Metas.
  // Sem correspondência, o assistente responde "não configurada" (nunca
  // adivinha uma Goal qualquer como se fosse a reserva).
  const reserveGoalRow = goals.find((g) => g.name.toLowerCase().includes("reserva")) ?? null;
  const reserveGoal = reserveGoalRow
    ? {
        targetAmount: reserveGoalRow.targetAmount,
        currentBalance: walletBalance(financeEntries, reserveGoalRow.walletId, today),
      }
    : null;

  const context: AiAssistantContext = {
    entries: financeEntries,
    wallets,
    categories,
    openIncidentCount: entryIncidents(entryRows).length,
    reserveGoal,
    today,
  };

  const result = answerQuestion(question, context);

  await prisma.aiInteraction.create({
    data: {
      workspaceId,
      askedBy: profile.id,
      question,
      answerQuery: (result.answerQuery ?? undefined) as object | undefined,
      answerText: result.answerText,
    },
  });

  revalidatePath("/painel/assistente");
  return { question, answerText: result.answerText, error: null };
}
