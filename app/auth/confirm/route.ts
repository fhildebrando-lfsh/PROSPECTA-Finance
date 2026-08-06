import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
 * do Supabase, que manda `?code=` pra `Site URL` sem trocar — foi essa
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

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const fallback = type === "invite" ? "/definir-senha" : "/painel";
      redirect(safeNext(next, fallback));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(safeNext(next, "/painel"));
  }

  redirect("/login");
}
