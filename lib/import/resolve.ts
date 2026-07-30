import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { duplicateKey } from "./duplicate-key";
import type { ParsedRow } from "./parse-row";

export interface ReferenceMaps {
  walletsByName: Map<string, { id: string }>;
  categoriesByNatureName: Map<string, { id: string }>;
  subcategoriesByCategoryAndName: Map<string, { id: string }>;
  peopleByName: Map<string, { id: string }>;
  existingDuplicateKeys: Set<string>;
}

/**
 * Uma consulta ao banco por importação (não por linha) — carrega tudo que
 * precisa existir para validar as ~5.900 linhas de uma vez, em memória.
 */
export async function buildReferenceMaps(workspaceId: string): Promise<ReferenceMaps> {
  const [wallets, categories, subcategories, people, existingEntries] = await Promise.all([
    prisma.wallet.findMany({ where: { workspaceId }, select: { id: true, name: true, legacyName: true } }),
    prisma.category.findMany({ select: { id: true, name: true, nature: true } }),
    prisma.subcategory.findMany({
      where: { OR: [{ workspaceId: null }, { workspaceId }] },
      select: { id: true, name: true, categoryId: true },
    }),
    prisma.person.findMany({ where: { workspaceId }, select: { id: true, name: true } }),
    prisma.entry.findMany({
      where: { workspaceId },
      select: {
        dueDate: true,
        amount: true,
        description: true,
        wallet: { select: { name: true } },
      },
    }),
  ]);

  // §9 — carteiras renomeadas (ex.: "Dívidas c/ Terceiros" -> "Empréstimos a
  // Terceiros") guardam o nome antigo em legacy_name justamente para que
  // planilhas exportadas antes do rename ainda sejam reconhecidas aqui.
  const walletsByName = new Map<string, { id: string }>();
  for (const w of wallets) {
    walletsByName.set(slugify(w.name), { id: w.id });
    if (w.legacyName) walletsByName.set(slugify(w.legacyName), { id: w.id });
  }

  return {
    walletsByName,
    categoriesByNatureName: new Map(categories.map((c) => [`${c.nature}::${slugify(c.name)}`, { id: c.id }])),
    subcategoriesByCategoryAndName: new Map(
      subcategories.map((s) => [`${s.categoryId}::${slugify(s.name)}`, { id: s.id }]),
    ),
    peopleByName: new Map(people.map((p) => [slugify(p.name), { id: p.id }])),
    existingDuplicateKeys: new Set(
      existingEntries.map((e) =>
        duplicateKey({
          dueDate: e.dueDate,
          amount: e.amount,
          description: e.description,
          walletName: e.wallet.name,
        }),
      ),
    ),
  };
}

export interface ResolvedRow {
  parsed: ParsedRow;
  walletId: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  responsibleId: string | null;
  isDuplicate: boolean;
}

/**
 * §18.1 passo 3 (parte que depende do banco): existência de carteira,
 * categoria e responsável são erro (bloqueia a linha); subcategoria que
 * não pertence à categoria e duplicata são aviso (linha importável).
 */
export function resolveRow(parsed: ParsedRow, refs: ReferenceMaps, seenKeysInBatch: Set<string>): ResolvedRow {
  const { data, issues } = parsed;

  let walletId: string | null = null;
  if (data.walletName) {
    const found = refs.walletsByName.get(slugify(data.walletName));
    if (found) walletId = found.id;
    else issues.push({ field: "walletName", severity: "erro", message: `carteira inexistente: "${data.walletName}"` });
  }

  let categoryId: string | null = null;
  if (data.categoryName && data.nature) {
    const found = refs.categoriesByNatureName.get(`${data.nature}::${slugify(data.categoryName)}`);
    if (found) categoryId = found.id;
    else {
      issues.push({ field: "categoryName", severity: "erro", message: `categoria inexistente: "${data.categoryName}"` });
    }
  }

  let subcategoryId: string | null = null;
  if (data.subcategoryName && categoryId) {
    const found = refs.subcategoriesByCategoryAndName.get(`${categoryId}::${slugify(data.subcategoryName)}`);
    if (found) {
      subcategoryId = found.id;
    } else {
      issues.push({
        field: "subcategoryName",
        severity: "aviso",
        message: `subcategoria não pertence à categoria: "${data.subcategoryName}"`,
      });
    }
  }

  let responsibleId: string | null = null;
  if (data.responsibleName) {
    const found = refs.peopleByName.get(slugify(data.responsibleName));
    if (found) responsibleId = found.id;
    else {
      issues.push({
        field: "responsibleName",
        severity: "erro",
        message: `responsável inexistente: "${data.responsibleName}"`,
      });
    }
  }

  let isDuplicate = false;
  if (data.dueDate && data.amount && data.description && data.walletName) {
    const key = duplicateKey({
      dueDate: data.dueDate,
      amount: data.amount,
      description: data.description,
      walletName: data.walletName,
    });
    if (refs.existingDuplicateKeys.has(key) || seenKeysInBatch.has(key)) {
      isDuplicate = true;
      issues.push({ field: "description", severity: "aviso", message: "possível duplicata" });
    }
    seenKeysInBatch.add(key);
  }

  return { parsed, walletId, categoryId, subcategoryId, responsibleId, isDuplicate };
}
