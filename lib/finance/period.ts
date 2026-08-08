import { Decimal, type EntryNature, type FinanceEntry, type FinanceWallet, type Period, type Regime } from "./types";
import { dashboardBalanceBlocks } from "./balance";
import { isWithin, monthRange } from "./dates";

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

export interface MonthlyPeriodTotals {
  period: Period;
  totals: PeriodTotals;
}

/**
 * Série de `count` meses consecutivos a partir de `startYear`/`startMonthIndex0`
 * (0-based), cada um com seu `periodTotals`. Extrai o loop que já existia,
 * repetido, em `painel/page.tsx` (gráficos "Últimos 6 meses" e "Provisão") — usado
 * pelos relatórios da Fase 2 (Analítico mês a mês, Balanço anual). Aceita offset
 * negativo em `startMonthIndex0` (ex.: -5), igual `monthRange` já aceita.
 */
export function monthlySeries(
  entries: FinanceEntry[],
  startYear: number,
  startMonthIndex0: number,
  count: number,
  regime: Regime = "caixa",
): MonthlyPeriodTotals[] {
  return Array.from({ length: count }, (_, i) => {
    const period = monthRange(startYear, startMonthIndex0 + i);
    return { period, totals: periodTotals(entries, period, regime) };
  });
}

export interface ProjectedBalancePoint {
  period: Period;
  /** Saldo acumulado projetado ao final deste mês (não o delta do mês isolado). */
  balance: Decimal;
}

export interface ProjectedBalanceResult {
  /** Saldo líquido real hoje (§11.2), ponto de partida da projeção. */
  current: Decimal;
  points: ProjectedBalancePoint[];
}

/**
 * §13 — Fluxo projetado: saldo futuro acumulado, mês a mês, a partir de
 * `fromDate`. Diferente do gráfico "Provisão" do Painel (que mostra o delta de
 * cada mês isoladamente): aqui cada ponto soma o mês ao acumulado anterior,
 * começando do saldo líquido real de hoje (`dashboardBalanceBlocks`). A
 * projeção começa no mês *seguinte* a `fromDate` (nunca no mês corrente) —
 * somar o mês corrente contaria duas vezes qualquer lançamento já liquidado
 * nele, que já está dentro do saldo de hoje.
 */
export function projectedBalance(
  entries: FinanceEntry[],
  wallets: FinanceWallet[],
  fromDate: Date,
  monthsAhead: number,
  regime: Regime = "caixa",
): ProjectedBalanceResult {
  const current = dashboardBalanceBlocks(entries, wallets, fromDate).total;

  let running = current;
  const points: ProjectedBalancePoint[] = [];
  for (let i = 1; i <= monthsAhead; i++) {
    const period = monthRange(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + i);
    running = running.plus(periodTotals(entries, period, regime).balanco);
    points.push({ period, balance: running });
  }

  return { current, points };
}
