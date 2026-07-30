import { Decimal, type FinanceEntry } from "./types";
import { addDays, addMonths, isWithin } from "./dates";

export interface CardConfig {
  closingDay: number;
  dueDay: number;
}

export interface StatementWindow {
  windowStart: Date;
  windowEnd: Date;
  dueDate: Date;
}

/**
 * §11.4 — janela de uma fatura que fecha no dia `closingDay` do mês/ano
 * informado: começa um dia depois do fechamento anterior e termina no
 * fechamento deste mês. Vencimento no `dueDay` do mês seguinte ao fechamento.
 */
export function cardStatementWindow(
  config: CardConfig,
  closingYear: number,
  closingMonthIndex0: number,
): StatementWindow {
  const windowEnd = new Date(Date.UTC(closingYear, closingMonthIndex0, config.closingDay));
  const previousClosing = addMonths(windowEnd, -1);
  const windowStart = addDays(previousClosing, 1);
  const dueDate = new Date(Date.UTC(closingYear, closingMonthIndex0 + 1, config.dueDay));

  return { windowStart, windowEnd, dueDate };
}

/**
 * §12 — "Vence = vencimento da fatura vigente se cartão de crédito", usado
 * pelo lançamento rápido. Se hoje ainda não passou do fechamento deste mês,
 * a fatura vigente é a que fecha este mês; senão, a do mês seguinte.
 */
export function currentStatementWindow(config: CardConfig, today: Date): StatementWindow {
  const closingMonthIndex0 = today.getUTCDate() <= config.closingDay ? today.getUTCMonth() : today.getUTCMonth() + 1;
  return cardStatementWindow(config, today.getUTCFullYear(), closingMonthIndex0);
}

/** §11.4 — soma por `transaction_date` (Compra), não por Vence. */
export function cardStatementTotal(entries: FinanceEntry[], walletId: string, window: StatementWindow): Decimal {
  return entries
    .filter((e) => e.walletId === walletId && isWithin(e.transactionDate, window.windowStart, window.windowEnd))
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
}

export interface CardCoverage {
  caixinhaBalance: Decimal;
  divida: Decimal;
  saldo: Decimal;
}

/**
 * §11.5 — Dívida Cartão soma o valor absoluto de tudo ainda A_PAGAR no
 * cartão. Saldo negativo = descoberto (a caixinha vinculada não cobre a fatura).
 */
export function cardCoverage(caixinhaBalance: Decimal, entries: FinanceEntry[], cardWalletId: string): CardCoverage {
  const divida = entries
    .filter((e) => e.walletId === cardWalletId && e.status === "A_PAGAR")
    .reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0));

  return { caixinhaBalance, divida, saldo: caixinhaBalance.minus(divida) };
}
