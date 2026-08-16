"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, assertCanWrite } from "@/lib/auth/session";
import { revertImportBatch } from "@/lib/import/revert";

export async function revertBatch(formData: FormData) {
  const profile = await requireProfile();
  const membership = profile.memberships[0];
  if (!membership) throw new Error("Sem workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin);

  const batchId = String(formData.get("batchId") ?? "");
  await revertImportBatch(batchId, membership.workspaceId);

  revalidatePath("/lancamentos/importar");
  revalidatePath("/lancamentos");
  revalidatePath("/painel");
}
