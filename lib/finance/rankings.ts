import { Decimal, type FinanceEntry, type Period, type Regime } from "./types";
import { dateForRegime, inPeriod } from "./period";

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

export interface CategoryMonthlyRow {
  categoryId: string;
  /** Σ |amount| de DESPESA por mês, índice 0 = janeiro. */
  monthly: Decimal[];
  total: Decimal;
}

/**
 * Balanço anual, bloco "descritivo por categoria" (§13, aba BALANCO da planilha
 * original) — Σ |amount| de DESPESA por categoria, com uma coluna por mês do
 * `year` + total anual. Mesmo escopo de `categoryDistribution` (só despesa),
 * generalizado para 12 meses de uma vez num único passe sobre `entries`, em vez
 * de chamar `categoryDistribution` 12 vezes. Ordenado por total anual
 * decrescente.
 */
export function categoryMonthlyBreakdown(entries: FinanceEntry[], year: number, regime: Regime = "caixa"): CategoryMonthlyRow[] {
  const yearPeriod: Period = { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year, 11, 31)) };
  const despesas = entries.filter((e) => e.nature === "DESPESA" && inPeriod(e, yearPeriod, regime));

  const monthlyByCategory = new Map<string, Decimal[]>();
  for (const entry of despesas) {
    const monthIndex = dateForRegime(entry, regime).getUTCMonth();
    const monthly = monthlyByCategory.get(entry.categoryId) ?? Array.from({ length: 12 }, () => new Decimal(0));
    monthly[monthIndex] = monthly[monthIndex].plus(entry.amount.abs());
    monthlyByCategory.set(entry.categoryId, monthly);
  }

  return [...monthlyByCategory.entries()]
    .map(([categoryId, monthly]) => ({
      categoryId,
      monthly,
      total: monthly.reduce((sum, v) => sum.plus(v), new Decimal(0)),
    }))
    .sort((a, b) => b.total.comparedTo(a.total));
}
