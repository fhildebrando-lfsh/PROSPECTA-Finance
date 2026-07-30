"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { acceptInvite } from "@/lib/workspace/invite";

export async function accept(formData: FormData) {
  const profile = await requireProfile();
  const token = String(formData.get("token") ?? "");
  await acceptInvite(token, profile.id, profile.email);
  redirect("/painel");
}
