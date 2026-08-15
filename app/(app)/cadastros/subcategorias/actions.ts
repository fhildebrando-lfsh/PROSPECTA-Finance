"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, requireWorkspaceId, assertCanWrite, assertIsAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { rethrowFriendly } from "@/lib/api/prisma-errors";

/**
 * Criar subcategoria é permitido para qualquer membro com permissão de
 * escrita no workspace (não só admin) — pedido explícito do usuário em
 * 2026-08-01, revertendo parcialmente a decisão anterior de deixar
 * Subcategoria 100% admin-only (ver seção 21 do PROJECT_STATE.md). Editar
 * e arquivar uma subcategoria já existente continuam admin-only abaixo.
 */
export async function createSubcategory(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);

  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId || !name) throw new Error("Categoria e nome são obrigatórios.");

  try {
    // workspaceId fica null — subcategoria é sempre global agora (§20 atualizado).
    await prisma.subcategory.create({
      data: { categoryId, workspaceId: null, name, slug: slugify(name), isSystem: false },
    });
  } catch (err) {
    rethrowFriendly(err, `Já existe uma subcategoria chamada "${name}" nessa categoria.`);
  }
  revalidatePath("/cadastros/subcategorias");
}

export async function updateSubcategory(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("Nome é obrigatório.");

  await prisma.subcategory.update({ where: { id }, data: { name } });
  revalidatePath("/cadastros/subcategorias");
}

export async function toggleSubcategoryActive(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  await prisma.subcategory.update({ where: { id }, data: { isActive: !isActive } });
  revalidatePath("/cadastros/subcategorias");
}

/**
 * Diferente de Carteira/Responsável: `Entry.subcategoryId` é opcional e a FK
 * é `ON DELETE SET NULL` (ver migration `20260729234528_entries`), então
 * excluir uma subcategoria nunca é bloqueado nem apaga lançamento nenhum —
 * as linhas que usavam essa subcategoria só perdem essa marcação específica,
 * mantendo categoria/valor/data intactos.
 */
export async function deleteSubcategory(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  await prisma.subcategory.delete({ where: { id } });
  revalidatePath("/cadastros/subcategorias");
}
