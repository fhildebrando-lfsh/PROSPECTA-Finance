import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// Next.js já carrega .env.local sozinho; scripts standalone rodados via
// tsx (prisma/seed*.ts) não, então garantimos aqui. Não sobrescreve o que
// já estiver definido.
loadEnv({ path: ".env.local" });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// DATABASE_URL aponta pro pooler de TRANSAÇÃO do Supabase (porta 6543,
// desde 2026-08-08) — o pooler de sessão (5432, usado antes) limitava o
// projeto inteiro a 15 conexões simultâneas, causa raiz de 2 quedas reais em
// produção (`/lancamentos`, 2026-08-01 e 2026-08-08). O de transação não tem
// esse teto por cliente. `max: 3` continua baixo de propósito, mesmo sem o
// teto de 15 — cada instância serverless só precisa de poucas conexões
// concorrentes, e um valor conservador evita qualquer surpresa.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
