"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, assertIsAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";

export async function createSubcategory(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId || !name) throw new Error("Categoria e nome são obrigatórios.");

  // workspaceId fica null — subcategoria é sempre global agora (§20 atualizado).
  await prisma.subcategory.create({
    data: { categoryId, workspaceId: null, name, slug: slugify(name), isSystem: false },
  });
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
