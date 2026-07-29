/**
 * Seed por workspace — roda DEPOIS que voce fizer login pela primeira vez
 * (o trigger em prisma/sql/001_auth_and_rls.sql ja cria seu workspace
 * pessoal e o profile). Carrega as suas 47 carteiras e os 12 responsaveis
 * (seed_carteiras.csv, seed_responsaveis.csv) dentro desse workspace.
 *
 * Requer que `npm run db:seed` (o seed global) ja tenha rodado antes —
 * as carteiras referenciam wallet_kinds e institutions que vem de la.
 *
 * Uso:
 *   npx tsx prisma/seed-workspace.ts                        (se so existir 1 workspace)
 *   npx tsx prisma/seed-workspace.ts --workspace-id=<uuid>   (veja o id em
 *     Supabase > Table Editor > workspaces, se houver mais de um)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db/prisma";
import { slugify } from "../lib/slug";

const SEEDS_DIR = join(__dirname, "..", "seeds");

function readCsv<T extends Record<string, string>>(filename: string): T[] {
  const raw = readFileSync(join(SEEDS_DIR, filename), "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true }) as T[];
}

const toBool = (v: string) => v.trim().toLowerCase() === "true";

async function resolveWorkspaceId(): Promise<string> {
  const workspaceIdArg = process.argv.find((a) => a.startsWith("--workspace-id="));
  if (workspaceIdArg) return workspaceIdArg.split("=")[1];

  const workspaces = await prisma.workspace.findMany();
  if (workspaces.length === 1) return workspaces[0].id;

  throw new Error(
    workspaces.length === 0
      ? "Nenhum workspace encontrado. Faca login no sistema primeiro."
      : `Existe mais de um workspace. Rode de novo com --workspace-id=<id>. Workspaces existentes: ${workspaces
          .map((w) => `${w.name} (${w.id})`)
          .join(", ")}`,
  );
}

async function seedPeople(workspaceId: string) {
  const rows = readCsv<{ name: string; is_shared: string; slug: string }>(
    "seed_responsaveis.csv",
  );

  for (const row of rows) {
    await prisma.person.upsert({
      where: { workspaceId_slug: { workspaceId, slug: row.slug } },
      create: {
        workspaceId,
        name: row.name,
        slug: row.slug,
        isShared: toBool(row.is_shared),
      },
      update: { name: row.name, isShared: toBool(row.is_shared) },
    });
  }
  console.log(`people: ${rows.length}`);
}

async function seedWallets(workspaceId: string) {
  const rows = readCsv<{
    name: string;
    kind: string;
    institution: string;
    is_pseudo_wallet: string;
    legacy_name: string;
    slug: string;
    linked_wallet: string;
    goal_purpose: string;
  }>("seed_carteiras.csv");

  for (const row of rows) {
    const institution = row.institution.trim()
      ? await prisma.institution.findUnique({ where: { slug: slugify(row.institution) } })
      : null;
    if (row.institution.trim() && !institution) {
      console.warn(
        `instituicao "${row.institution}" (carteira "${row.slug}") nao encontrada — rode "npm run db:seed" primeiro. Carteira criada sem instituicao.`,
      );
    }

    await prisma.wallet.upsert({
      where: { workspaceId_slug: { workspaceId, slug: row.slug } },
      create: {
        workspaceId,
        name: row.name,
        kindCode: row.kind,
        institutionId: institution?.id,
        isPseudoWallet: toBool(row.is_pseudo_wallet),
        legacyName: row.legacy_name || null,
        slug: row.slug,
        goalPurpose: row.goal_purpose || null,
      },
      update: {
        name: row.name,
        kindCode: row.kind,
        institutionId: institution?.id,
        goalPurpose: row.goal_purpose || null,
      },
    });
  }

  // segunda passada: linked_wallet referencia o slug de outra carteira (§9).
  let linkedCount = 0;
  for (const row of rows) {
    if (!row.linked_wallet.trim()) continue;
    const target = await prisma.wallet.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: row.linked_wallet.trim() } },
    });
    if (!target) {
      console.warn(`linked_wallet "${row.linked_wallet}" (referenciado por "${row.slug}") nao encontrado — pulei.`);
      continue;
    }
    await prisma.wallet.update({
      where: { workspaceId_slug: { workspaceId, slug: row.slug } },
      data: { linkedWalletId: target.id },
    });
    linkedCount += 1;
  }

  console.log(`wallets: ${rows.length} (linked_wallet aplicado em ${linkedCount})`);
}

async function main() {
  const workspaceId = await resolveWorkspaceId();
  await seedPeople(workspaceId);
  await seedWallets(workspaceId);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
