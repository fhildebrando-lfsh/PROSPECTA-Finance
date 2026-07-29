import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// Next.js já carrega .env.local sozinho; scripts standalone rodados via
// tsx (prisma/seed*.ts) não, então garantimos aqui. Não sobrescreve o que
// já estiver definido.
loadEnv({ path: ".env.local" });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
