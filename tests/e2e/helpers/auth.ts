import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Strict" | "Lax" | "None";
  expires: number; // -1 = cookie de sessão (sem expiração), formato exigido pelo Playwright
}

function toPlaywrightSameSite(value: CookieOptions["sameSite"]): "Strict" | "Lax" | "None" {
  if (value === true) return "Strict";
  if (value === "strict") return "Strict";
  if (value === "none") return "None";
  return "Lax";
}

/**
 * Login sem senha (técnica já documentada em PROJECT_STATE.md, seção 21):
 * gera um magic link via Admin API e troca por sessão real chamando
 * `verifyOtp()` DIRETO pela API do Supabase (nunca navegando o browser pro
 * link — isso usa hash fragment/implicit flow, que a rota de callback do
 * app não trata). O `createServerClient` com um cookie jar em memória como
 * adapter faz a própria lib `@supabase/ssr` gerar os cookies no formato
 * exato que ela espera ler depois (nome `sb-<ref>-auth-token`, com chunking
 * automático se passar de ~3180 bytes) — nunca reconstruído à mão.
 */
export async function getSessionCookies(email: string, domain = "localhost"): Promise<SessionCookie[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const admin = createAdminClient(supabaseUrl, serviceRoleKey);
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData.properties?.hashed_token) {
    throw new Error(`Falha ao gerar magic link para ${email}: ${linkError?.message ?? "hashed_token ausente"}`);
  }

  const jar = new Map<string, { value: string; options: CookieOptions }>();
  const client = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => Array.from(jar.entries()).map(([name, { value }]) => ({ name, value })),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          jar.set(name, { value, options: options ?? {} });
        }
      },
    },
  });

  const { error: verifyError } = await client.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) {
    throw new Error(`Falha ao trocar o magic link por sessão para ${email}: ${verifyError.message}`);
  }
  if (jar.size === 0) {
    throw new Error("verifyOtp() não gravou nenhum cookie de sessão — algo mudou na lib @supabase/ssr?");
  }

  return Array.from(jar.entries()).map(([name, { value, options }]) => ({
    name,
    value,
    domain,
    path: options.path ?? "/",
    httpOnly: options.httpOnly ?? true,
    secure: options.secure ?? false,
    sameSite: toPlaywrightSameSite(options.sameSite),
    expires: -1,
  }));
}
