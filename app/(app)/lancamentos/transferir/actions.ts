"use server";

import { redirect } from "next/navigation";
import { requireProfile, assertCanWrite } from "@/lib/auth/session";
import { createTransfer } from "@/lib/entries/transfer";

export async function submitTransfer(formData: FormData) {
  const profile = await requireProfile();
  const membership = profile.memberships[0];
  if (!membership) throw new Error("Sem workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);

  const absAmount = Math.abs(Number(formData.get("amount") ?? "0"));
  if (!absAmount) throw new Error("Informe um valor.");

  await createTransfer(membership.workspaceId, profile.id, {
    fromWalletId: String(formData.get("fromWalletId") ?? ""),
    toWalletId: String(formData.get("toWalletId") ?? ""),
    amount: absAmount.toFixed(2),
    date: String(formData.get("date") ?? ""),
    responsibleId: String(formData.get("responsibleId") ?? ""),
    subcategoryId: String(formData.get("subcategoryId") ?? "") || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
  });

  redirect("/lancamentos");
}
