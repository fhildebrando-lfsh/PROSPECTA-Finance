/**
 * Caminhos que o middleware (`proxy.ts` → `lib/supabase/middleware.ts`) deixa
 * passar sem exigir sessão. Extraído para cá — em vez de ficar solto dentro do
 * middleware — porque a lista é uma decisão de segurança que precisa de teste
 * próprio: middleware não é exercitado por nenhuma suíte, então um caminho
 * faltando aqui falha em silêncio, em produção.
 *
 * - `/login`, `/auth`, `/redefinir-senha`, `/politica-privacidade`: fluxo de
 *   entrada e páginas públicas. `/redefinir-senha` precisa entrar porque a
 *   sessão de recuperação é estabelecida no client (hash/code da URL do e-mail
 *   do Supabase), então o primeiro request chega sem sessão.
 * - `/api/cron`: **não é rota de usuário.** Quem chama é o Vercel Cron
 *   (`vercel.json`), que manda só `Authorization: Bearer ${CRON_SECRET}` e
 *   nenhum cookie. Sem estar aqui, o middleware redirecionava para `/login` e
 *   o handler nunca executava — a automação não rodava e o 302 ainda contava
 *   como execução bem-sucedida no painel da Vercel (bug real, 2026-08-16).
 *   Liberar do middleware **não** é liberar acesso: a própria rota devolve 401
 *   sem o bearer correto (`app/api/cron/automations/route.ts`). O segredo é o
 *   portão; o middleware de sessão só não é o mecanismo certo aqui.
 */
export const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/redefinir-senha",
  "/politica-privacidade",
  "/api/cron",
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}
