import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

// Placeholder até o DATABASE_URL real (Supabase) ser preenchido em .env.local —
// permite `prisma validate`/`format` funcionarem antes da conexão existir.
// `prisma migrate` e `prisma db seed` exigem a URL real.
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
