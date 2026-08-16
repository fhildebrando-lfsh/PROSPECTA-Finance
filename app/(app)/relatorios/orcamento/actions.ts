"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

async function currentMembership(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  return { role: membership.role, isPlatformAdmin: profile.isPlatformAdmin };
}

/**
 * Cria ou atualiza o valor orçado de uma categoria num mês (§13, aba ORÇ).
 * Mesma permissão de Carteiras/Responsáveis — orçamento é planejamento do
 * workspace, não taxonomia estrutural (Categoria em si continua admin-only).
 */
export async function setBudget(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin);

  const categoryId = String(formData.get("categoryId") ?? "");
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const rawAmount = String(formData.get("plannedAmount") ?? "").trim().replace(",", ".");

  if (!categoryId || !year || !month || month < 1 || month > 12) {
    throw new Error("Categoria, ano e mês são obrigatórios.");
  }
  const plannedAmount = Number(rawAmount);
  if (Number.isNaN(plannedAmount) || plannedAmount < 0) {
    throw new Error("Valor orçado inválido — use um número maior ou igual a zero.");
  }

  await prisma.budget.upsert({
    where: { workspaceId_categoryId_year_month: { workspaceId, categoryId, year, month } },
    create: { workspaceId, categoryId, year, month, plannedAmount },
    update: { plannedAmount },
  });

  revalidatePath("/relatorios/orcamento");
}
