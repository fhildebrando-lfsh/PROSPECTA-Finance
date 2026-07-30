"use server";

import { redirect } from "next/navigation";
import { requireProfile, assertCanWrite } from "@/lib/auth/session";
import { createEntryOrSeries } from "@/lib/entries/create";
import { createEntrySchema } from "@/lib/validation/entry";

/**
 * §12 — o usuário nunca digita o sinal (§8.3): escolhe Despesa/Receita e
 * digita o valor absoluto, o sistema aplica o sinal aqui.
 */
export async function createQuickEntry(formData: FormData) {
  const profile = await requireProfile();
  const membership = profile.memberships[0];
  if (!membership) throw new Error("Sem workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin);

  const nature = String(formData.get("nature") ?? "DESPESA");
  const absAmount = Math.abs(Number(formData.get("amount") ?? "0"));
  if (!absAmount) throw new Error("Informe um valor.");
  const signedAmount = nature === "DESPESA" ? -absAmount : absAmount;

  const installmentsRaw = Number(formData.get("installmentsTotal") ?? "1");

  const input = createEntrySchema.parse({
    walletId: String(formData.get("walletId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    subcategoryId: String(formData.get("subcategoryId") ?? "") || undefined,
    responsibleId: String(formData.get("responsibleId") ?? ""),
    nature,
    amount: signedAmount.toFixed(2),
    description: String(formData.get("description") ?? "").trim() || "(sem descrição)",
    transactionDate: String(formData.get("transactionDate") ?? ""),
    dueDate: String(formData.get("dueDate") ?? ""),
    statusCode: String(formData.get("statusCode") ?? ""),
    recurrenceCode: String(formData.get("recurrenceCode") ?? "UNICA"),
    note: String(formData.get("note") ?? "").trim() || undefined,
    installmentsTotal: installmentsRaw >= 2 ? installmentsRaw : undefined,
  });

  await createEntryOrSeries(membership.workspaceId, profile.id, input);
  redirect("/lancamentos");
}
