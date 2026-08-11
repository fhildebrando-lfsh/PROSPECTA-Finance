import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  // Todos os specs compartilham UM usuário/workspace de teste (criado no
  // globalSetup) — sem paralelismo entre arquivos pra evitar um teste
  // interferir na contagem/estado que outro está checando.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // Turbopack compila cada rota sob demanda na primeira visita em `next
  // dev` — o primeiro request de uma Server Action nunca antes compilada
  // pode passar de 5s (padrão do Playwright) sem que nada esteja errado.
  expect: { timeout: 15_000 },
  timeout: 45_000,
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // Gerado pelo globalSetup (login via magic link, sem senha) — todo
    // teste já nasce autenticado como o usuário de teste E2E.
    storageState: "tests/e2e/.auth/session.json",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // O guard roda ANTES do `next dev` de verdade existir — não depende da
    // ordem interna entre globalSetup/webServer do Playwright.
    command: "npx tsx scripts/assert-dev-database.ts && npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
