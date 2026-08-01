import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// Next.js já carrega .env.local sozinho; scripts standalone rodados via
// tsx (prisma/seed*.ts) não, então garantimos aqui. Não sobrescreve o que
// já estiver definido.
loadEnv({ path: ".env.local" });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// max baixo de propósito: o pooler de sessão do Supabase (porta 5432) limita
// o projeto inteiro a 15 conexões simultâneas. Sem isso, cada instância
// serverless da Vercel abre até 10 (default do `pg`), e poucas requisições
// concorrentes já estouram o limite — foi a causa raiz de um 500 real em
// produção (`/lancamentos`, `/lancamentos/novo`) em 2026-08-01.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
