import { Decimal, type FinanceEntry, type Regime } from "./types";
import { monthRange } from "./dates";
import { periodTotals } from "./period";

/**
 * §11.6 — média das despesas dos últimos `monthsBack` meses FECHADOS
 * (não inclui o mês corrente, ainda em curso). `DESPESA` já exclui
 * transferências e investimentos por natureza (nature ≠ OUTRO/INVESTIMENTO).
 * Só liquidado — é uma média de gasto real, não do que estava previsto
 * (2026-08-11).
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
    return periodTotals(entries, period, "settled", regime).despesa.abs();
  });

  const sum = monthlyExpenses.reduce((total, expense) => total.plus(expense), new Decimal(0));
  return sum.div(monthsBack);
}

/**
 * Espelha `averageMonthlyExpense` — usada pelo Método PROSPECTAR §13.5
 * (ARQUITETURA-METODO-PROSPECTAR.md §5.3.1, Etapa 5) como denominador do
 * indicador de Endividamento do PSF ("compromisso mensal ÷ renda líquida
 * média" — troca de propósito em relação à tela de Dívidas, que usa despesa).
 */
export function averageMonthlyIncome(
  entries: FinanceEntry[],
  referenceDate: Date,
  monthsBack = 6,
  regime: Regime = "caixa",
): Decimal {
  if (monthsBack <= 0) return new Decimal(0);

  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();

  const monthlyIncomes = Array.from({ length: monthsBack }, (_, i) => {
    const monthsAgo = i + 1;
    const period = monthRange(refYear, refMonth - monthsAgo);
    return periodTotals(entries, period, "settled", regime).receita;
  });

  const sum = monthlyIncomes.reduce((total, income) => total.plus(income), new Decimal(0));
  return sum.div(monthsBack);
}
