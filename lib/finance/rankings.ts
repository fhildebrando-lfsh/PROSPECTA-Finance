import { Decimal, type FinanceEntry, type Period, type Regime } from "./types";
import { inPeriod } from "./period";

/**
 * §11.8 — TOP 5 (ou N) receitas/despesas do período, ordenadas pelo
 * valor absoluto decrescente.
 */
export function topEntries(
  entries: FinanceEntry[],
  nature: "RECEITA" | "DESPESA",
  period: Period,
  regime: Regime = "caixa",
  limit = 5,
): FinanceEntry[] {
  return entries
    .filter((e) => e.nature === nature && inPeriod(e, period, regime))
    .sort((a, b) => b.amount.abs().comparedTo(a.amount.abs()))
    .slice(0, limit);
}

export interface CategoryDistributionRow {
  categoryId: string;
  total: Decimal;
  percentage: Decimal;
}

/** §11.8 — Σ |amount| de DESPESA por categoria, com % do total de despesas do período. */
export function categoryDistribution(
  entries: FinanceEntry[],
  period: Period,
  regime: Regime = "caixa",
): CategoryDistributionRow[] {
  const despesas = entries.filter((e) => e.nature === "DESPESA" && inPeriod(e, period, regime));

  const totalsByCategory = new Map<string, Decimal>();
  for (const entry of despesas) {
    const current = totalsByCategory.get(entry.categoryId) ?? new Decimal(0);
    totalsByCategory.set(entry.categoryId, current.plus(entry.amount.abs()));
  }

  const totalDespesa = [...totalsByCategory.values()].reduce((sum, v) => sum.plus(v), new Decimal(0));

  return [...totalsByCategory.entries()].map(([categoryId, total]) => ({
    categoryId,
    total,
    percentage: totalDespesa.isZero() ? new Decimal(0) : total.div(totalDespesa).times(100),
  }));
}
