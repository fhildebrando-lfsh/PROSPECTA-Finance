"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, assertIsAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { rethrowFriendly } from "@/lib/api/prisma-errors";
import type { EntryNature } from "@/app/generated/prisma/enums";

/**
 * Ordem nunca repete dentro do mesmo Tipo — inserir/mover para uma posição já
 * ocupada empurra as demais categorias daquele Tipo para abrir espaço, em vez
 * de deixar dois itens com o mesmo número (pedido do usuário em 2026-08-01).
 */
export async function createCategory(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const nature = String(formData.get("nature") ?? "") as EntryNature;
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  if (!nature || !name) throw new Error("Natureza e nome são obrigatórios.");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.category.updateMany({
        where: { nature, sortOrder: { gte: sortOrder } },
        data: { sortOrder: { increment: 1 } },
      });
      await tx.category.create({
        data: { nature, name, slug: slugify(name), sortOrder, isSystem: false },
      });
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

  const existing = await prisma.category.findUniqueOrThrow({ where: { id } });

  await prisma.$transaction(async (tx) => {
    if (sortOrder > existing.sortOrder) {
      // moveu para uma ordem maior: quem estava entre a antiga e a nova posição sobe um lugar
      await tx.category.updateMany({
        where: { nature: existing.nature, id: { not: id }, sortOrder: { gt: existing.sortOrder, lte: sortOrder } },
        data: { sortOrder: { decrement: 1 } },
      });
    } else if (sortOrder < existing.sortOrder) {
      // moveu para uma ordem menor: quem estava entre a nova e a antiga posição desce um lugar
      await tx.category.updateMany({
        where: { nature: existing.nature, id: { not: id }, sortOrder: { gte: sortOrder, lt: existing.sortOrder } },
        data: { sortOrder: { increment: 1 } },
      });
    }
    await tx.category.update({ where: { id }, data: { name, sortOrder } });
  });

  revalidatePath("/cadastros/categorias");
}
