"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { notifyAdminsOfPendingApproval } from "@/lib/workspace/pending-approval";

async function currentOrigin() {
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${protocol}://${headerList.get("host")}`;
}

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
  const fullName = String(formData.get("fullName") ?? "").trim();
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const acceptedPrivacyPolicy = formData.get("acceptPrivacyPolicy") === "on";
  if (!email || !password) return { error: "Preencha e-mail e senha.", info: null };
  if (!fullName) return { error: "Informe seu nome.", info: null };
  if (password.length < 8) return { error: "A senha precisa de pelo menos 8 caracteres.", info: null };
  if (password !== confirmPassword) return { error: "As senhas não coincidem.", info: null };
  // LGPD Art. 8º §2º — o ônus de provar o consentimento é do controlador,
  // então isso é validado no servidor também, não só travado no HTML.
  if (!acceptedPrivacyPolicy) return { error: "Você precisa aceitar a Política de Privacidade para criar a conta.", info: null };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { error: error.message, info: null };

  // O trigger de signup já criou a Profile na mesma transação do INSERT em
  // auth.users — se isso falhar (ex.: race condition improvável), a conta já
  // existe mesmo assim; o consentimento em si já foi obtido e validado acima,
  // só não teria o carimbo de data gravado.
  if (data.user) {
    await prisma.profile
      .update({ where: { id: data.user.id }, data: { privacyPolicyAcceptedAt: new Date() } })
      .catch((err) => console.error("[signup] falha ao gravar aceite da política de privacidade:", err));

    // O trigger on_auth_user_created já rodou (mesma transação do INSERT em auth.users)
    // — se não tinha convite pendente pra este e-mail, o workspace já nasceu bloqueado
    // (AGUARDANDO_APROVACAO, ver prisma/sql/010). Avisa os admins por e-mail.
    let membership = await prisma.membership.findFirst({
      where: { profileId: data.user.id },
      include: { workspace: true },
    });
    for (let attempt = 0; !membership && attempt < 5; attempt++) {
      await new Promise((r) => setTimeout(r, 200));
      membership = await prisma.membership.findFirst({
        where: { profileId: data.user.id },
        include: { workspace: true },
      });
    }
    if (membership?.workspace.blockedReason === "AGUARDANDO_APROVACAO") {
      await notifyAdminsOfPendingApproval(membership.workspaceId, await currentOrigin()).catch((err) =>
        console.error("[signup] falha ao notificar admins:", err),
      );
    }
  }

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

  const origin = await currentOrigin();

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  });
  // Nunca revela se o e-mail existe ou não (evita enumeração de contas).
  if (error) return { error: error.message, info: null };

  return {
    error: null,
    info: "Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha.",
  };
}
