import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Mesmo padrão de tests/integration/setup.ts: carrega .env.dev.local
// explicitamente e aborta se não confirmar o banco de dev/teste. Usa `pg`
// puro (não o Prisma Client gerado) de propósito — o client gerado usa
// `import.meta`, incompatível com o transform CommonJS que o Playwright
// aplica nos arquivos que ele carrega (confirmado tentando antes; mesmo
// padrão de vários scripts avulsos já usados nesta sessão).
const DEV_PROJECT_REF = "fmxzooefvbvhmgczznsa";
const PROD_PROJECT_REF = "zfugldawxhvzclooisqj";

if (existsSync(".env.dev.local")) {
  loadEnv({ path: ".env.dev.local" });
} else if (!process.env.DATABASE_URL) {
  throw new Error("Testes E2E exigem .env.dev.local (banco de dev/teste) ou as variáveis já no ambiente.");
}

const databaseUrl = process.env.DATABASE_URL ?? "";
if (databaseUrl.includes(PROD_PROJECT_REF)) {
  throw new Error("ABORTADO: credenciais de PRODUÇÃO detectadas — testes E2E nunca podem rodar contra produção.");
}
if (!databaseUrl.includes(DEV_PROJECT_REF)) {
  throw new Error(`ABORTADO: não confirmei o ref de dev/teste ("${DEV_PROJECT_REF}") em DATABASE_URL.`);
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export interface E2ETestUser {
  userId: string;
  profileId: string;
  workspaceId: string;
  email: string;
  walletId: string;
  walletName: string;
  personId: string;
  personName: string;
}

/**
 * Cria um usuário REAL no Supabase Auth (Admin API) — diferente das
 * fixtures de integração (Profile direto via Prisma, sem Auth), aqui
 * precisamos de login de verdade. O trigger de signup
 * (handle_new_auth_user, prisma/sql/001) cria Profile+Workspace+Membership
 * automaticamente. Depois, popula uma carteira e um responsável mínimos
 * pro workspace não ficar vazio nos testes de formulário.
 */
export async function createE2EUser(): Promise<E2ETestUser> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createAdminClient(supabaseUrl, serviceRoleKey);

  const email = `e2e+${randomUUID()}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: "[e2e] usuário de teste" },
  });
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário E2E: ${error?.message ?? "sem data.user"}`);
  }
  const userId = data.user.id;

  return withClient(async (client) => {
    // Trigger de signup roda de forma assíncrona em relação à resposta da
    // Admin API — espera curto e confirma antes de seguir, em vez de assumir.
    let workspaceId: string | null = null;
    for (let attempt = 0; !workspaceId && attempt < 20; attempt++) {
      const { rows } = await client.query(`select workspace_id from memberships where profile_id = $1 limit 1`, [
        userId,
      ]);
      workspaceId = rows[0]?.workspace_id ?? null;
      if (!workspaceId) await new Promise((r) => setTimeout(r, 250));
    }
    if (!workspaceId) {
      throw new Error(`Trigger de signup não criou workspace/membership pro usuário E2E ${userId} a tempo.`);
    }

    // requireActiveMembership() redireciona pra /aceitar-politica sem isso
    // (LGPD, §requireActiveMembership em lib/auth/session.ts) — contas
    // criadas pela Admin API não passam pelo checkbox de cadastro normal.
    await client.query(`update profiles set privacy_policy_accepted_at = now() where id = $1`, [userId]);

    // Cadastro sem convite (2026-08-12) nasce bloqueado (AGUARDANDO_APROVACAO, ver
    // prisma/sql/010_self_signup_requires_approval.sql) — desbloqueia aqui porque os
    // specs E2E existentes assumem acesso imediato; um spec específico sobre o fluxo de
    // aprovação deve testar o bloqueio direto, não via esta fixture compartilhada.
    await client.query(`update workspaces set blocked_at = null, blocked_reason = null where id = $1`, [
      workspaceId,
    ]);

    const suffix = randomUUID().slice(0, 8);
    const walletName = `[e2e] carteira ${suffix}`;
    const personName = `[e2e] responsável ${suffix}`;
    const [walletResult, personResult] = await Promise.all([
      client.query(
        `insert into wallets (workspace_id, name, kind_code, slug) values ($1, $2, $3, $4) returning id`,
        [workspaceId, walletName, "CONTA_BANCARIA", `e2e-carteira-${suffix}`],
      ),
      client.query(`insert into people (workspace_id, name, slug) values ($1, $2, $3) returning id`, [
        workspaceId,
        personName,
        `e2e-responsavel-${suffix}`,
      ]),
    ]);

    return {
      userId,
      profileId: userId,
      workspaceId,
      email,
      walletId: walletResult.rows[0].id,
      walletName,
      personId: personResult.rows[0].id,
      personName,
    };
  });
}

export interface E2ETestUserWithSecondWorkspace extends E2ETestUser {
  secondWorkspaceId: string;
  secondWorkspaceName: string;
}

/**
 * Adiciona uma segunda Membership `ADVISOR` (workspace novo) pro mesmo
 * Profile — cenário que exercita o `WorkspaceSwitcher` de verdade (só vira
 * `<select>` com 2+ memberships; ver components/WorkspaceSwitcher.tsx).
 * De propósito **não** é usado no usuário padrão de `createE2EUser()`: com
 * duas memberships, `resolveActiveMembership()` (lib/auth/session.ts) não
 * garante qual é `memberships[0]` sem cookie — usar isto no usuário
 * compartilhado por todos os specs arriscaria os outros testes operarem no
 * workspace errado de vez em quando. Só o spec de troca de workspace usa,
 * com login/sessão próprios.
 */
export async function addSecondWorkspaceMembership(user: E2ETestUser): Promise<E2ETestUserWithSecondWorkspace> {
  return withClient(async (client) => {
    const secondWorkspaceName = `[e2e] segundo workspace ${randomUUID().slice(0, 8)}`;
    const { rows } = await client.query(`insert into workspaces (name) values ($1) returning id`, [
      secondWorkspaceName,
    ]);
    const secondWorkspaceId = rows[0].id;
    await client.query(`insert into memberships (workspace_id, profile_id, role) values ($1, $2, 'ADVISOR')`, [
      secondWorkspaceId,
      user.profileId,
    ]);
    return { ...user, secondWorkspaceId, secondWorkspaceName };
  });
}

/** Workspace não é filho de Membership — precisa ser apagado à parte (mesma razão de cleanupE2EUser). */
export async function cleanupSecondWorkspace(workspaceId: string) {
  await withClient((client) => client.query(`delete from workspaces where id = $1`, [workspaceId])).catch(() => {});
}

/**
 * `admin.auth.admin.deleteUser` dispara o trigger on_auth_user_deleted
 * (prisma/sql/002), que apaga o Profile (cascade apaga a Membership) — mas
 * o Workspace em si não é filho de Profile, fica órfão e precisa ser
 * apagado à parte (mesmo espírito de cleanupTestWorkspace da suíte de
 * integração — onDelete: Cascade cuida de todo o resto por baixo dele).
 */
export async function cleanupE2EUser(user: E2ETestUser) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createAdminClient(supabaseUrl, serviceRoleKey);

  await admin.auth.admin.deleteUser(user.userId);
  await withClient((client) => client.query(`delete from workspaces where id = $1`, [user.workspaceId])).catch(
    () => {},
  );
}
