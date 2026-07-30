"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";

async function currentMembership(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  return { role: membership.role, isPlatformAdmin: profile.isPlatformAdmin };
}

export async function createWallet(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin);

  const name = String(formData.get("name") ?? "").trim();
  const kindCode = String(formData.get("kindCode") ?? "");
  const institutionId = String(formData.get("institutionId") ?? "") || null;
  const closingDay = formData.get("closingDay") ? Number(formData.get("closingDay")) : null;
  const dueDay = formData.get("dueDay") ? Number(formData.get("dueDay")) : null;
  const creditLimit = formData.get("creditLimit") ? String(formData.get("creditLimit")) : null;

  if (!name || !kindCode) throw new Error("Nome e tipo de carteira são obrigatórios.");

  await prisma.wallet.create({
    data: {
      workspaceId,
      name,
      kindCode,
      institutionId,
      closingDay,
      dueDay,
      creditLimit: creditLimit ? creditLimit : undefined,
      slug: slugify(name),
    },
  });

  revalidatePath("/cadastros/carteiras");
}

export async function updateWallet(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const institutionId = String(formData.get("institutionId") ?? "") || null;
  const closingDay = formData.get("closingDay") ? Number(formData.get("closingDay")) : null;
  const dueDay = formData.get("dueDay") ? Number(formData.get("dueDay")) : null;
  const creditLimit = formData.get("creditLimit") ? String(formData.get("creditLimit")) : null;

  if (!id || !name) throw new Error("Nome é obrigatório.");

  await prisma.wallet.update({
    where: { id, workspaceId },
    data: { name, institutionId, closingDay, dueDay, creditLimit: creditLimit ? creditLimit : null },
  });

  revalidatePath("/cadastros/carteiras");
}

export async function toggleWalletActive(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  // §20 — nunca apaga (histórico não pode desaparecer), só arquiva/desarquiva.
  await prisma.wallet.update({ where: { id, workspaceId }, data: { isActive: !isActive } });

  revalidatePath("/cadastros/carteiras");
}
