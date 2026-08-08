import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client com a service role key — contorna RLS e enxerga `auth.users`
 * inteiro. NUNCA importar isto num Client Component nem devolver a chave
 * ao browser; só usar em Server Components/Actions/Route Handlers, e só
 * para operações que exigem visão de todo o sistema (ex.: listar todos os
 * usuários cadastrados, admin.usuarios).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
