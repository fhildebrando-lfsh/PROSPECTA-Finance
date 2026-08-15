"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseIsoDate } from "@/lib/validation/entry";

async function currentMembership(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  return {
    role: membership.role,
    isPlatformAdmin: profile.isPlatformAdmin,
    advisorCanWrite: membership.advisorCanWrite,
  };
}

export async function createGoal(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const name = String(formData.get("name") ?? "").trim();
  const walletId = String(formData.get("walletId") ?? "");
  const targetAmount = Math.abs(Number(formData.get("targetAmount") ?? "0"));
  const targetDateRaw = String(formData.get("targetDate") ?? "").trim();

  if (!name || !walletId || !targetAmount) {
    throw new Error("Preencha nome, caixinha e valor-alvo.");
  }

  await prisma.goal.create({
    data: {
      workspaceId,
      walletId,
      name,
      targetAmount: targetAmount.toFixed(2),
      targetDate: targetDateRaw ? parseIsoDate(targetDateRaw) : null,
    },
  });

  revalidatePath("/patrimonio/metas");
  revalidatePath("/painel");
}

export async function updateGoal(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = Math.abs(Number(formData.get("targetAmount") ?? "0"));
  const targetDateRaw = String(formData.get("targetDate") ?? "").trim();

  if (!id || !name || !targetAmount) throw new Error("Nome e valor-alvo são obrigatórios.");

  await prisma.goal.update({
    where: { id, workspaceId },
    data: { name, targetAmount: targetAmount.toFixed(2), targetDate: targetDateRaw ? parseIsoDate(targetDateRaw) : null },
  });

  revalidatePath("/patrimonio/metas");
  revalidatePath("/painel");
}

/** Arquivar — para meta que ainda existe mas você quer tirar da lista ativa sem perder o histórico. */
export async function archiveGoal(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  await prisma.goal.update({ where: { id, workspaceId }, data: { isActive: !isActive } });
  revalidatePath("/patrimonio/metas");
  revalidatePath("/painel");
}

/** "Mostrar no Painel" — preferência de exibição, não dado da meta, por isso
 * fica fora da trava de edição do card (clicável direto, mesmo espírito do
 * botão Arquivar). */
export async function toggleGoalPinned(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const pinnedToPainel = formData.get("pinnedToPainel") === "true";

  await prisma.goal.update({ where: { id, workspaceId }, data: { pinnedToPainel: !pinnedToPainel } });
  revalidatePath("/patrimonio/metas");
  revalidatePath("/painel");
}

/** Excluir de verdade — a meta é só metadado (nome, alvo, caixinha vinculada), não
 * tem lançamento nenhum ligado a ela (guardar dinheiro é uma transferência normal,
 * que continua existindo mesmo se a meta for apagada) — então excluir aqui nunca
 * arrisca perder histórico financeiro, diferente de Bens. */
export async function deleteGoal(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Meta não identificada.");

  await prisma.goal.delete({ where: { id, workspaceId } });
  revalidatePath("/patrimonio/metas");
  revalidatePath("/painel");
}
