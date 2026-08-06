"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type SetPasswordState = { error: string | null };

export async function setInvitePassword(
  _prevState: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  await requireProfile();

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) return { error: "A senha precisa de pelo menos 8 caracteres." };
  if (password !== confirmPassword) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/painel");
}
