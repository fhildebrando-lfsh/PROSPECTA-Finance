import { prisma } from "@/lib/db/prisma";

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
}

/**
 * Versão em lote de `/api/entries/suggest-category` (mesma ideia: repetição
 * exata da descrição, já usada no lançamento rápido) — usada pela importação
 * de OFX, que pode ter centenas de transações num só arquivo e não pode fazer
 * uma consulta por linha. Busca todo o histórico do workspace uma vez, agrupa
 * por descrição normalizada em memória e pega a categoria mais frequente por
 * descrição — mesma técnica de "uma consulta por importação" já usada em
 * `resolve.ts::buildReferenceMaps`.
 */
export async function suggestCategoriesByDescription(workspaceId: string): Promise<Map<string, CategorySuggestion>> {
  const entries = await prisma.entry.findMany({
    where: { workspaceId },
    select: {
      description: true,
      categoryId: true,
      subcategoryId: true,
      category: { select: { name: true } },
      subcategory: { select: { name: true } },
    },
  });

  const countsByDescription = new Map<
    string,
    Map<string, { count: number; categoryName: string; subcategoryId: string | null; subcategoryName: string | null }>
  >();
  for (const entry of entries) {
    const key = entry.description.trim().toLowerCase();
    if (!key) continue;
    const byCategory = countsByDescription.get(key) ?? new Map();
    const current = byCategory.get(entry.categoryId) ?? {
      count: 0,
      categoryName: entry.category.name,
      subcategoryId: entry.subcategoryId,
      subcategoryName: entry.subcategory?.name ?? null,
    };
    current.count += 1;
    byCategory.set(entry.categoryId, current);
    countsByDescription.set(key, byCategory);
  }

  const suggestions = new Map<string, CategorySuggestion>();
  for (const [description, byCategory] of countsByDescription) {
    let best:
      | { categoryId: string; count: number; categoryName: string; subcategoryId: string | null; subcategoryName: string | null }
      | null = null;
    for (const [categoryId, v] of byCategory) {
      if (!best || v.count > best.count) best = { categoryId, ...v };
    }
    if (best) {
      suggestions.set(description, {
        categoryId: best.categoryId,
        categoryName: best.categoryName,
        subcategoryId: best.subcategoryId,
        subcategoryName: best.subcategoryName,
      });
    }
  }

  return suggestions;
}
