"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { createClientPreRegistration, cancelClientPreRegistration } from "@/lib/workspace/client-onboarding";

export async function createClient(formData: FormData) {
  const profile = await requireAdminProfile();

  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();
  const planId = String(formData.get("planId") ?? "");
  const advisorProfileId = String(formData.get("advisorProfileId") ?? "").trim() || undefined;
  const phone = String(formData.get("phone") ?? "").trim() || undefined;

  await createClientPreRegistration({ clientName, clientEmail, planId, createdBy: profile.id, advisorProfileId, phone });
  revalidatePath("/admin/clientes");
}

export async function cancelClient(formData: FormData) {
  await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  await cancelClientPreRegistration(workspaceId);
  revalidatePath("/admin/clientes");
}
