import { Decimal, type FinanceEntry, type Regime } from "./types";
import { monthRange } from "./dates";
import { periodTotals } from "./period";

/**
 * §11.6 — média das despesas dos últimos `monthsBack` meses FECHADOS
 * (não inclui o mês corrente, ainda em curso). `DESPESA` já exclui
 * transferências e investimentos por natureza (nature ≠ OUTRO/INVESTIMENTO).
 */
export function averageMonthlyExpense(
  entries: FinanceEntry[],
  referenceDate: Date,
  monthsBack = 6,
  regime: Regime = "caixa",
): Decimal {
  if (monthsBack <= 0) return new Decimal(0);

  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();

  const monthlyExpenses = Array.from({ length: monthsBack }, (_, i) => {
    const monthsAgo = i + 1; // meses fechados, exclui o mês corrente
    const period = monthRange(refYear, refMonth - monthsAgo);
    return periodTotals(entries, period, regime).despesa.abs();
  });

  const sum = monthlyExpenses.reduce((total, expense) => total.plus(expense), new Decimal(0));
  return sum.div(monthsBack);
}

/** meta_reserva = despesa_mensal_média × meses_alvo (default 6, §11.6). */
export function emergencyReserveTarget(avgMonthlyExpense: Decimal, monthsTarget = 6): Decimal {
  return avgMonthlyExpense.abs().times(monthsTarget);
}

export interface ReserveCoverage {
  target: Decimal;
  ratio: Decimal;
  percentage: Decimal;
}

export function emergencyReserveCoverage(
  reserveBalance: Decimal,
  avgMonthlyExpense: Decimal,
  monthsTarget = 6,
): ReserveCoverage {
  const target = emergencyReserveTarget(avgMonthlyExpense, monthsTarget);
  const ratio = target.isZero() ? new Decimal(0) : reserveBalance.div(target);
  return { target, ratio, percentage: ratio.times(100) };
}

export type ReserveGaugeBand = "vermelho" | "ambar" | "verde";

/** §11.6 — faixas do gauge: vermelho até 33%, âmbar até 66%, verde acima. */
export function reserveGaugeBand(percentage: Decimal | number): ReserveGaugeBand {
  const value = percentage instanceof Decimal ? percentage.toNumber() : percentage;
  if (value < 33) return "vermelho";
  if (value < 66) return "ambar";
  return "verde";
}
