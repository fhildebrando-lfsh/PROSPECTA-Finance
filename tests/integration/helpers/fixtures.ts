import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import type { EntryNature } from "@/app/generated/prisma/enums";

/**
 * Cria um Profile+Workspace+Membership de teste direto via Prisma — sem
 * signup real no Supabase Auth (Profile.id não tem mais FK pra auth.users
 * desde prisma/sql/002_drop_cross_schema_fk.sql, só um trigger de delete).
 * Um workspace por arquivo de teste (beforeAll/afterAll), nunca por `it`.
 */
export async function createTestWorkspace() {
  const profile = await prisma.profile.create({
    data: { id: randomUUID(), fullName: "Teste de Integração" },
  });
  const workspace = await prisma.workspace.create({
    data: { name: `[teste] workspace ${profile.id.slice(0, 8)}` },
  });
  await prisma.membership.create({
    data: { workspaceId: workspace.id, profileId: profile.id, role: "TITULAR", status: "ACTIVE" },
  });
  return { workspaceId: workspace.id, profileId: profile.id };
}

/** `Workspace` tem onDelete: Cascade em todas as tabelas por workspace — um delete só. */
export async function cleanupTestWorkspace(workspaceId: string, profileId: string) {
  await prisma.workspace.delete({ where: { id: workspaceId } });
  await prisma.profile.delete({ where: { id: profileId } });
}

export async function createTestWallet(workspaceId: string, kindCode = "CONTA_BANCARIA") {
  const suffix = randomUUID().slice(0, 8);
  return prisma.wallet.create({
    data: {
      workspaceId,
      name: `[teste] carteira ${suffix}`,
      kindCode,
      slug: `teste-carteira-${suffix}`,
    },
  });
}

export async function createTestPerson(workspaceId: string) {
  const suffix = randomUUID().slice(0, 8);
  return prisma.person.create({
    data: {
      workspaceId,
      name: `[teste] responsável ${suffix}`,
      slug: `teste-responsavel-${suffix}`,
    },
  });
}

/** Categorias já vêm seedadas globalmente por `prisma/seed.ts` — nunca recriadas aqui. */
export async function categoryBySlug(nature: EntryNature, slug: string) {
  return prisma.category.findUniqueOrThrow({ where: { nature_slug: { nature, slug } } });
}
