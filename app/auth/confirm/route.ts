import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { acceptPendingInviteForEmail } from "@/lib/workspace/invite";
import { notifyAdminsOfPendingApproval } from "@/lib/workspace/pending-approval";

/** Só caminhos internos — mesma regra de `safeRedirectTo` do login (evita open redirect). */
function safeNext(raw: string | null, fallback: string) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

/**
 * Ponto único de callback de autenticação — cobre tanto link de e-mail do
 * Supabase (confirmação de cadastro, convite, recuperação, troca de e-mail,
 * via `verifyOtp` com `token_hash`/`type`) quanto login social OAuth (Google
 * etc., via `exchangeCodeForSession` com `code`). Os dois estabelecem a
 * sessão no servidor via cookie antes do redirect (diferente do link padrão
 * do Supabase, que manda `?code=` para `Site URL` sem trocar — foi essa
 * lacuna que causou o bug de "cai em /login em vez de logar direto"
 * descoberto em 2026-08-04).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const supabase = await createClient();
  let ok = false;
  let fallback = "/painel";

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    ok = !error;
    fallback = type === "invite" ? "/definir-senha" : "/painel";
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (ok) {
    // Rede de segurança para login (magic link ou Google) de um e-mail que já
    // tinha conta antes de um convite novo ser criado — o trigger de signup
    // só aceita convite pendente na hora do CADASTRO, nunca num login
    // seguinte. Ver lib/workspace/invite.ts::acceptPendingInviteForEmail.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      await acceptPendingInviteForEmail(user.id, user.email).catch((err) =>
        console.error("[auth/confirm] falha ao aceitar convite pendente:", err),
      );

      // Primeiro login via Google sem convite pendente também dispara
      // on_auth_user_created — mesmo aviso pros admins do fluxo de e-mail/senha
      // (app/(auth)/login/actions.ts::signup), ver prisma/sql/010.
      const membership = await prisma.membership.findFirst({
        where: { profileId: user.id },
        include: { workspace: true },
      });
      if (membership?.workspace.blockedReason === "AGUARDANDO_APROVACAO") {
        await notifyAdminsOfPendingApproval(membership.workspaceId, request.nextUrl.origin).catch((err) =>
          console.error("[auth/confirm] falha ao notificar admins:", err),
        );
      }
    }
    redirect(safeNext(next, fallback));
  }

  redirect("/login");
}
