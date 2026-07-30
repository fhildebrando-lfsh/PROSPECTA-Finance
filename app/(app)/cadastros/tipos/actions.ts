"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, assertIsAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { EntryNature } from "@/app/generated/prisma/enums";

/**
 * Só o rótulo muda — a natureza em si (as 4 chaves) é fixa no código, toda
 * regra de /lib/finance depende disso (§20).
 */
export async function updateNatureLabel(formData: FormData) {
  const profile = await requireProfile();
  assertIsAdmin(profile.isPlatformAdmin);

  const code = String(formData.get("code") ?? "") as EntryNature;
  const labelPt = String(formData.get("labelPt") ?? "").trim();
  if (!code || !labelPt) throw new Error("Rótulo é obrigatório.");

  await prisma.natureLabel.update({ where: { code }, data: { labelPt } });
  revalidatePath("/cadastros/tipos");
}
