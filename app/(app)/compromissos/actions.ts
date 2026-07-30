"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, assertCanWrite } from "@/lib/auth/session";
import { settleEntry } from "@/lib/entries/settle";

export async function markSettled(formData: FormData) {
  const profile = await requireProfile();
  const membership = profile.memberships[0];
  if (!membership) throw new Error("Sem workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin);

  const id = String(formData.get("id") ?? "");
  await settleEntry(id, membership.workspaceId, profile.id);
  revalidatePath("/compromissos");
  revalidatePath("/lancamentos");
  revalidatePath("/painel");
}
