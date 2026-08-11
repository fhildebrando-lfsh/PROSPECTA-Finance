import { config as loadEnv } from "dotenv";

// Pré-voo do `npm run test:e2e` (encadeado no comando `webServer` do
// playwright.config.ts, ANTES do `next dev` de verdade subir): confere que
// .env.local — o arquivo que o `next dev` real usa — aponta pro projeto
// Supabase de dev/teste, nunca produção. Mesma lógica de
// tests/integration/setup.ts, mas apontada pro arquivo que o servidor
// real usa (não .env.dev.local, que só os testes de integração leem).
//
// Refs de projeto não são segredo (aparecem em texto puro em
// PROJECT_STATE.md, que está no Git) — só a URL/chaves/senha é que não vão
// pro repositório.
const DEV_PROJECT_REF = "fmxzooefvbvhmgczznsa";
const PROD_PROJECT_REF = "zfugldawxhvzclooisqj";

loadEnv({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL ?? "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

if (databaseUrl.includes(PROD_PROJECT_REF) || supabaseUrl.includes(PROD_PROJECT_REF)) {
  console.error(
    "ABORTADO: .env.local aponta para o projeto Supabase de PRODUÇÃO. " +
      "Testes E2E nunca podem rodar contra produção — confira o conteúdo de .env.local antes de continuar.",
  );
  process.exit(1);
}

if (!databaseUrl.includes(DEV_PROJECT_REF) || !supabaseUrl.includes(DEV_PROJECT_REF)) {
  console.error(
    `ABORTADO: não foi possível confirmar que .env.local aponta para o projeto de dev/teste (ref esperado "${DEV_PROJECT_REF}"). ` +
      "Confira DATABASE_URL/NEXT_PUBLIC_SUPABASE_URL antes de rodar os testes E2E.",
  );
  process.exit(1);
}

console.log("[assert-dev-database] .env.local confirmado apontando pro banco de dev/teste.");
