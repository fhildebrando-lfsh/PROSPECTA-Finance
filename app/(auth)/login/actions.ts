"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null; info: string | null };

function credentialsFrom(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = credentialsFrom(formData);
  if (!email || !password) return { error: "Preencha e-mail e senha.", info: null };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, info: null };

  redirect("/painel");
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { email, password } = credentialsFrom(formData);
  if (!email || !password) return { error: "Preencha e-mail e senha.", info: null };
  if (password.length < 8) return { error: "A senha precisa de pelo menos 8 caracteres.", info: null };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message, info: null };

  return {
    error: null,
    info: "Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.",
  };
}
