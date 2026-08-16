/**
 * Seed global — Fase 0 (ESPECIFICACAO-SISTEMA-FINANCEIRO.md §22, §25).
 *
 * Carrega apenas as referências que NAO dependem de um workspace ainda
 * existir: tipos de carteira, situacoes, periodicidades e a taxonomia
 * completa (Tipo -> Categoria -> Subcategoria).
 *
 * Carteiras e responsaveis sao dados por workspace — ver seed-workspace.ts,
 * que roda depois que voce tiver feito login pela primeira vez.
 *
 * Uso: npm run db:seed
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/db/prisma";
import { slugify } from "../lib/slug";
import { EntryNature, MacroBloco } from "../app/generated/prisma/enums";

const SEEDS_DIR = join(__dirname, "..", "seeds");

function parseNature(value: string): EntryNature {
  if (value in EntryNature) return value as EntryNature;
  throw new Error(`seed_taxonomia.csv: nature desconhecida "${value}"`);
}

function parseMacroBloco(value: string): MacroBloco {
  if (value in MacroBloco) return value as MacroBloco;
  throw new Error(`seed_macro_blocos.csv: macro_bloco desconhecido "${value}"`);
}

function readCsv<T extends Record<string, string>>(filename: string): T[] {
  const raw = readFileSync(join(SEEDS_DIR, filename), "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true }) as T[];
}

const toBool = (v: string) => v.trim().toLowerCase() === "true";
const toIntOrNull = (v: string) => (v.trim() === "" ? null : Number.parseInt(v, 10));

async function seedWalletKinds() {
  const rows = readCsv<{
    code: string;
    label_pt: string;
    affects_net_worth: string;
    is_liability: string;
  }>("seed_tipos_carteira.csv");

  for (const row of rows) {
    await prisma.walletKind.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        labelPt: row.label_pt,
        affectsNetWorth: toBool(row.affects_net_worth),
        isLiability: toBool(row.is_liability),
      },
      update: {
        labelPt: row.label_pt,
        affectsNetWorth: toBool(row.affects_net_worth),
        isLiability: toBool(row.is_liability),
      },
    });
  }
  console.log(`wallet_kinds: ${rows.length}`);
}

async function seedInvestmentClasses() {
  const rows = readCsv<{
    code: string;
    label_pt: string;
    group_label: string;
    sort_order: string;
  }>("seed_investment_classes.csv");

  for (const row of rows) {
    await prisma.investmentClass.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        labelPt: row.label_pt,
        groupLabel: row.group_label,
        sortOrder: Number.parseInt(row.sort_order, 10),
      },
      update: {
        labelPt: row.label_pt,
        groupLabel: row.group_label,
        sortOrder: Number.parseInt(row.sort_order, 10),
      },
    });
  }
  console.log(`investment_classes: ${rows.length}`);
}

async function seedStatuses() {
  const rows = readCsv<{ code: string; label_pt: string; counts_as_settled: string }>(
    "seed_situacoes.csv",
  );

  for (const row of rows) {
    await prisma.status.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        labelPt: row.label_pt,
        countsAsSettled: toBool(row.counts_as_settled),
      },
      update: {
        labelPt: row.label_pt,
        countsAsSettled: toBool(row.counts_as_settled),
      },
    });
  }
  console.log(`statuses: ${rows.length}`);
}

async function seedRecurrenceKinds() {
  const rows = readCsv<{ code: string; legacy_label: string; interval_months: string }>(
    "seed_recorrencias.csv",
  );

  for (const row of rows) {
    await prisma.recurrenceKind.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        legacyLabel: row.legacy_label || null,
        intervalMonths: Number.parseInt(row.interval_months, 10),
      },
      update: {
        legacyLabel: row.legacy_label || null,
        intervalMonths: Number.parseInt(row.interval_months, 10),
      },
    });
  }
  console.log(`recurrence_kinds: ${rows.length}`);
}

async function seedTaxonomia() {
  const rows = readCsv<{
    nature: string;
    category: string;
    subcategory: string;
    category_sort_order: string;
    category_slug: string;
    subcategory_slug: string;
  }>("seed_taxonomia.csv");

  const categoryKey = (nature: string, slug: string) => `${nature}::${slug}`;
  const categoryIdByKey = new Map<string, string>();

  for (const row of rows) {
    const key = categoryKey(row.nature, row.category_slug);
    if (categoryIdByKey.has(key)) continue;

    const nature = parseNature(row.nature);
    const category = await prisma.category.upsert({
      where: { nature_slug: { nature, slug: row.category_slug } },
      create: {
        nature,
        name: row.category,
        slug: row.category_slug,
        sortOrder: toIntOrNull(row.category_sort_order) ?? 0,
        isSystem: true,
      },
      update: {
        name: row.category,
        sortOrder: toIntOrNull(row.category_sort_order) ?? 0,
      },
    });
    categoryIdByKey.set(key, category.id);
  }

  let subcategoryCount = 0;
  for (const row of rows) {
    if (!row.subcategory.trim()) continue;

    const categoryId = categoryIdByKey.get(categoryKey(row.nature, row.category_slug))!;

    // Prisma nao aceita null em campo de chave composta unica em `upsert`
    // (workspaceId eh opcional), por isso find-then-write manual aqui.
    const existing = await prisma.subcategory.findFirst({
      where: { categoryId, workspaceId: null, slug: row.subcategory_slug },
    });
    if (existing) {
      await prisma.subcategory.update({
        where: { id: existing.id },
        data: { name: row.subcategory },
      });
    } else {
      await prisma.subcategory.create({
        data: {
          categoryId,
          workspaceId: null,
          name: row.subcategory,
          slug: row.subcategory_slug,
          isSystem: true,
        },
      });
    }
    subcategoryCount += 1;
  }

  console.log(`categories: ${categoryIdByKey.size}`);
  console.log(`subcategories: ${subcategoryCount}`);
}

async function seedInstitutions() {
  const rows = readCsv<{ institution: string }>("seed_carteiras.csv");
  const names = [...new Set(rows.map((r) => r.institution.trim()).filter(Boolean))];

  for (const name of names) {
    const slug = slugify(name);
    await prisma.institution.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
    });
  }
  console.log(`institutions: ${names.length}`);
}

/** Método PROSPECTAR §13.3 (Etapa 1, 2026-08-15) — classificação inicial das
 * subcategorias de Despesa nos 4 blocos da Régua de Alocação. Editável depois
 * pelo admin (mesmo espírito de NatureLabel) — este seed nunca sobrescreve
 * uma classificação que já existe, só preenche o que ainda está nulo. */
async function seedMacroBlocos() {
  const rows = readCsv<{ category_slug: string; subcategory_slug: string; macro_bloco: string }>(
    "seed_macro_blocos.csv",
  );

  let updated = 0;
  for (const row of rows) {
    if (!row.macro_bloco) continue; // linhas de ajuste contábil (ex.: "Ajuste") ficam sem macro_bloco

    const subcategory = await prisma.subcategory.findFirst({
      where: {
        slug: row.subcategory_slug,
        workspaceId: null,
        category: { slug: row.category_slug, nature: "DESPESA" },
      },
    });
    if (!subcategory) {
      throw new Error(`seed_macro_blocos.csv: subcategoria "${row.category_slug}/${row.subcategory_slug}" não encontrada`);
    }
    if (subcategory.macroBloco !== null) continue; // não sobrescreve classificação já feita (pelo admin ou por este seed antes)

    await prisma.subcategory.update({
      where: { id: subcategory.id },
      data: { macroBloco: parseMacroBloco(row.macro_bloco) },
    });
    updated += 1;
  }
  console.log(`macro_blocos: ${updated} subcategorias classificadas (${rows.length - updated} já tinham valor ou são sem macro_bloco)`);
}

async function seedNatureLabels() {
  const defaults: Record<string, string> = {
    RECEITA: "Receita",
    DESPESA: "Despesa",
    INVESTIMENTO: "Investimento",
    OUTRO: "Outro",
  };

  for (const [rawCode, labelPt] of Object.entries(defaults)) {
    const code = parseNature(rawCode);
    await prisma.natureLabel.upsert({
      where: { code },
      create: { code, labelPt },
      update: {}, // não sobrescreve se o admin já renomeou
    });
  }
  console.log(`nature_labels: ${Object.keys(defaults).length}`);
}

async function main() {
  await seedWalletKinds();
  await seedStatuses();
  await seedRecurrenceKinds();
  await seedTaxonomia();
  await seedInstitutions();
  await seedNatureLabels();
  await seedInvestmentClasses();
  await seedMacroBlocos(); // depois de seedTaxonomia — precisa das subcategorias já existirem
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
