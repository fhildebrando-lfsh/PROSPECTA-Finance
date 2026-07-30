"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, assertIsAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { rethrowFriendly } from "@/lib/api/prisma-errors";
import type { EntryNature } from "@/app/generated/prisma/enums";

export async function createCategory(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const nature = String(formData.get("nature") ?? "") as EntryNature;
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (!nature || !name) throw new Error("Natureza e nome são obrigatórios.");

  try {
    await prisma.category.create({
      data: { nature, name, slug: slugify(name), sortOrder, isSystem: false },
    });
  } catch (err) {
    rethrowFriendly(err, `Já existe uma categoria chamada "${name}" nesse tipo.`);
  }
  revalidatePath("/cadastros/categorias");
}

export async function updateCategory(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (!id || !name) throw new Error("Nome é obrigatório.");

  await prisma.category.update({ where: { id }, data: { name, sortOrder } });
  revalidatePath("/cadastros/categorias");
}
