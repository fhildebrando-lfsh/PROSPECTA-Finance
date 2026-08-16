"use server";

import { revalidatePath } from "next/cache";
import { requireProfile, assertCanWrite } from "@/lib/auth/session";
import { settleEntry } from "@/lib/entries/settle";

export async function markSettled(formData: FormData) {
  const profile = await requireProfile();
  const membership = profile.memberships[0];
  if (!membership) throw new Error("Sem workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  await settleEntry(id, membership.workspaceId, profile.id);
  revalidatePath("/compromissos");
  revalidatePath("/lancamentos");
  revalidatePath("/painel");
}

/** Mesma ação de cima, em lote — usada pela seleção por checkbox da Lista de
 * Compromissos. Tolerante a falha individual (ex.: duas abas marcando o mesmo
 * lançamento ao mesmo tempo) — não aborta o lote inteiro por causa de uma linha. */
export async function bulkMarkSettled(ids: string[]) {
  const profile = await requireProfile();
  const membership = profile.memberships[0];
  if (!membership) throw new Error("Sem workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);

  const results = await Promise.allSettled(ids.map((id) => settleEntry(id, membership.workspaceId, profile.id)));
  const settled = results.filter((r) => r.status === "fulfilled").length;

  revalidatePath("/compromissos");
  revalidatePath("/lancamentos");
  revalidatePath("/painel");
  return { settled, total: ids.length };
}
