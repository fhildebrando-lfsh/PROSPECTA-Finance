"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export type AcceptPolicyState = { error: string | null };

export async function acceptPrivacyPolicy(
  _prevState: AcceptPolicyState,
  formData: FormData,
): Promise<AcceptPolicyState> {
  const profile = await requireProfile();

  if (formData.get("acceptPrivacyPolicy") !== "on") {
    return { error: "Você precisa aceitar a Política de Privacidade pra continuar." };
  }

  await prisma.profile.update({ where: { id: profile.id }, data: { privacyPolicyAcceptedAt: new Date() } });

  redirect("/painel");
}
