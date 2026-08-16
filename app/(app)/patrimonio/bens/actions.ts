"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAsset, registerAssetValuation } from "@/lib/entries/asset";

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

export async function createAssetAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const responsibleId = String(formData.get("responsibleId") ?? "");
  const acquisitionDate = String(formData.get("acquisitionDate") ?? "");
  const absAmount = Math.abs(Number(formData.get("acquisitionAmount") ?? "0"));

  if (!name || !categoryId || !responsibleId || !acquisitionDate || !absAmount) {
    throw new Error("Preencha nome, categoria, responsável, data e valor de aquisição.");
  }

  await createAsset(workspaceId, profileId, {
    name,
    categoryId,
    responsibleId,
    acquisitionDate,
    acquisitionAmount: absAmount.toFixed(2),
  });

  revalidatePath("/patrimonio/bens");
}

export async function registerValuationAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const assetId = String(formData.get("assetId") ?? "");
  const date = String(formData.get("date") ?? "");
  const responsibleId = String(formData.get("responsibleId") ?? "");
  const absAmount = Math.abs(Number(formData.get("amount") ?? "0"));
  const kind = String(formData.get("kind") ?? "valorizacao");

  if (!assetId || !date || !responsibleId || !absAmount) {
    throw new Error("Preencha data, valor e responsável.");
  }

  const signedAmount = kind === "desvalorizacao" ? -absAmount : absAmount;

  await registerAssetValuation(workspaceId, profileId, {
    assetId,
    date,
    responsibleId,
    amount: signedAmount.toFixed(2),
  });

  revalidatePath(`/patrimonio/bens/${assetId}`);
  revalidatePath("/patrimonio/bens");
}

/** Renomeia/recategoriza o bem — não mexe nas entries já lançadas (a data e o
 * valor de cada valorização continuam os que foram registrados; só a próxima
 * valorização usa a categoria nova, ver `registerAssetValuation`). */
export async function updateAssetAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");

  if (!id || !name || !categoryId) throw new Error("Nome e categoria são obrigatórios.");

  await prisma.asset.update({ where: { id, workspaceId }, data: { name, categoryId } });
  revalidatePath(`/patrimonio/bens/${id}`);
  revalidatePath("/patrimonio/bens");
}

/** Arquivar (§20) — para quando o bem continua tendo existido de verdade (ex.:
 * vendeu o carro) e você quer manter o histórico, só tirando da lista ativa. */
export async function archiveAsset(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  await prisma.asset.update({ where: { id, workspaceId }, data: { isActive: !isActive } });
  revalidatePath("/patrimonio/bens");
}

/** Excluir de verdade — para desfazer um cadastro por engano. Diferente de
 * Carteira/Subcategoria (nunca exclui em uso): aqui as entries ligadas ao bem
 * só existem para documentar o valor dele, então cascateiam junto (ver o
 * comentário do relacionamento `Entry.asset` no schema). Sem confirmação por
 * JavaScript — mesma UX simples de "Arquivar" já usada no resto do sistema;
 * o botão é vermelho e o rótulo deixa claro que é permanente. */
export async function deleteAssetAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Bem não identificado.");

  await prisma.asset.delete({ where: { id, workspaceId } });

  revalidatePath("/patrimonio/bens");
  redirect("/patrimonio/bens");
}
