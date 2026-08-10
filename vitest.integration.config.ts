import { defineConfig } from "vitest/config";
import path from "node:path";

// Config separado do vitest.config.ts (unitários) de propósito — testes
// aqui batem em Postgres real (banco de dev/teste, nunca produção; ver
// tests/integration/setup.ts) e nunca devem rodar como parte de `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    // Todos os arquivos compartilham o mesmo banco Postgres real — evita
    // corrida entre workspaces de teste de arquivos diferentes.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
