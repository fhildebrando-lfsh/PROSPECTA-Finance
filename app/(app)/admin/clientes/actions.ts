"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import {
  createClientPreRegistration,
  cancelClientPreRegistration,
  resendClientInvite,
} from "@/lib/workspace/client-onboarding";

async function currentOrigin() {
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${protocol}://${headerList.get("host")}`;
}

export async function createClient(formData: FormData) {
  const profile = await requireAdminProfile();

  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim();
  const planId = String(formData.get("planId") ?? "");
  const advisorProfileId = String(formData.get("advisorProfileId") ?? "").trim() || undefined;
  const phone = String(formData.get("phone") ?? "").trim() || undefined;

  await createClientPreRegistration({
    clientName,
    clientEmail,
    planId,
    createdBy: profile.id,
    advisorProfileId,
    phone,
    origin: await currentOrigin(),
  });
  revalidatePath("/admin/clientes");
}

export async function cancelClient(formData: FormData) {
  await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  await cancelClientPreRegistration(workspaceId);
  revalidatePath("/admin/clientes");
}

export async function resendInvite(formData: FormData) {
  await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  await resendClientInvite(workspaceId, await currentOrigin());
  revalidatePath("/admin/clientes");
}
