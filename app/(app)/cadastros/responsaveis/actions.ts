"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { rethrowFriendly } from "@/lib/api/prisma-errors";

async function currentMembership(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  return { role: membership.role, isPlatformAdmin: profile.isPlatformAdmin };
}

export async function createPerson(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin);

  const name = String(formData.get("name") ?? "").trim();
  const isShared = formData.get("isShared") === "on";
  if (!name) throw new Error("Nome é obrigatório.");

  try {
    await prisma.person.create({ data: { workspaceId, name, isShared, slug: slugify(name) } });
  } catch (err) {
    rethrowFriendly(err, `Já existe um responsável chamado "${name}".`);
  }
  revalidatePath("/cadastros/responsaveis");
}

export async function updatePerson(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const isShared = formData.get("isShared") === "on";
  if (!id || !name) throw new Error("Nome é obrigatório.");

  await prisma.person.update({ where: { id, workspaceId }, data: { name, isShared } });
  revalidatePath("/cadastros/responsaveis");
}

export async function deletePerson(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  try {
    await prisma.person.delete({ where: { id, workspaceId } });
  } catch {
    throw new Error("Não dá para excluir — esse responsável já tem lançamentos.");
  }
  revalidatePath("/cadastros/responsaveis");
}
