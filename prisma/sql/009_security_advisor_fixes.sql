-- Corrige os achados do Supabase Security Advisor (e-mail automático de 2026-08-11,
-- "Action required: security vulnerabilities detected", projeto financas-pessoais):
--
-- 1) RLS Disabled in Public — `_prisma_migrations` era a única tabela do schema public
--    sem Row Level Security (as outras 32 já tinham RLS completa desde o trabalho de RLS
--    completa anterior). Sem nenhuma policy de propósito — ninguém precisa ler/escrever
--    essa tabela via API, só a própria ferramenta de migration (que conecta como owner/
--    postgres, que sempre ignora RLS).
alter table public._prisma_migrations enable row level security;

-- 2) Public/Signed-In Can Execute SECURITY DEFINER Function — as 5 funções abaixo nunca
--    tiveram GRANT/REVOKE explícito desde que foram criadas (prisma/sql/001, 002), então
--    ficaram com o padrão do Postgres + o default do Supabase: chamáveis por QUALQUER UM
--    via RPC do PostgREST (`/rest/v1/rpc/...`), autenticado ou não. O app não usa
--    PostgREST hoje (acessa o banco via `pg`/Prisma com uma role privilegiada, que não é
--    afetada por REVOKE de `anon`/`authenticated`/`public`) — isto é defesa em
--    profundidade, sem efeito no funcionamento atual do app.
--
--    handle_new_auth_user/handle_deleted_auth_user só disparam via trigger — a execução
--    do trigger não depende de GRANT EXECUTE de quem faz o INSERT/DELETE em auth.users
--    (é o motor de triggers do Postgres que invoca, não uma chamada de função direta) —
--    revoga de todo mundo, ninguém precisa chamar via API.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_deleted_auth_user() from public, anon, authenticated;

--    is_platform_admin/is_workspace_member/workspace_role são usadas DENTRO das policies
--    de RLS de praticamente toda tabela (ver prisma/sql/001, 003, 004, 005, 006, 008) —
--    `authenticated` precisa continuar podendo executá-las pra essas policies
--    funcionarem se algum dia forem exercidas via PostgREST; só remove de `anon`
--    (visitante sem login, que não tem motivo nenhum pra chamar isso direto).
revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.workspace_role(uuid) from public, anon;
