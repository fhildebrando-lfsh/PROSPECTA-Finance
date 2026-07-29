import { Decimal, type EntryNature, type FinanceEntry, type Period, type Regime } from "./types";
import { isWithin } from "./dates";

/** §10 R2 — Caixa usa `Vence` (default de todo relatório), Competência usa `Compra`. */
export function dateForRegime(entry: Pick<FinanceEntry, "transactionDate" | "dueDate">, regime: Regime): Date {
  return regime === "caixa" ? entry.dueDate : entry.transactionDate;
}

export function inPeriod(entry: FinanceEntry, period: Period, regime: Regime): boolean {
  return isWithin(dateForRegime(entry, regime), period.start, period.end);
}

export interface PeriodTotals {
  receita: Decimal;
  despesa: Decimal;
  investimento: Decimal;
  balanco: Decimal;
}

/**
 * §11.3 — a fórmula da planilha não filtra por situação (inclui A_PAGAR,
 * A_RECEBER, ESTIMATIVA junto com o liquidado). É a visão "quanto era
 * esperado no período", diferente do saldo realizado de walletBalance
 * (§11.1). `nature = OUTRO` (transferências, §10 R5) já fica fora por
 * construção — nenhum filtro adicional necessário.
 */
export function periodTotals(entries: FinanceEntry[], period: Period, regime: Regime = "caixa"): PeriodTotals {
  const inScope = entries.filter((e) => inPeriod(e, period, regime));

  const sumNature = (nature: EntryNature) =>
    inScope.filter((e) => e.nature === nature).reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

  const receita = sumNature("RECEITA");
  const despesa = sumNature("DESPESA");
  const investimento = sumNature("INVESTIMENTO");

  return { receita, despesa, investimento, balanco: receita.plus(despesa).plus(investimento) };
}
