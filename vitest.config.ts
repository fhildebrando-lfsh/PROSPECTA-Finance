import { configDefaults, defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // tests/integration/** bate no Postgres real (banco de dev/teste) e tem
    // guard/setup próprios — nunca deve rodar como parte de `npm test`
    // (unitários, sem banco). Ver vitest.integration.config.ts.
    exclude: [...configDefaults.exclude, "tests/integration/**"],
  },
});
