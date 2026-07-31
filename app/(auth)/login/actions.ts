"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null; info: string | null };

function credentialsFrom(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

/** Só aceita caminhos relativos internos — evita open redirect via query string. */
function safeRedirectTo(formData: FormData) {
  const raw = String(formData.get("redirectTo") ?? "");
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/painel";
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

  redirect(safeRedirectTo(formData));
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

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Informe seu e-mail.", info: null };

  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  const origin = `${protocol}://${headerList.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  });
  // Nunca revela se o e-mail existe ou não (evita enumeração de contas).
  if (error) return { error: error.message, info: null };

  return {
    error: null,
    info: "Se esse e-mail estiver cadastrado, enviamos um link pra redefinir a senha.",
  };
}
