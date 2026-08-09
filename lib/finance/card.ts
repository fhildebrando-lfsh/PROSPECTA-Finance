import { Decimal, type FinanceEntry } from "./types";
import { addDays, addMonths, isWithin } from "./dates";

/**
 * Gasto real (valor absoluto) de despesas na carteira nos últimos 12 meses
 * antes de `referenceDate`, por `transaction_date` (mesma base de
 * `cardStatementTotal`) — usado pela Análise de Benefícios (Cartões de
 * Crédito) para comparar pontos/milhas ganhos contra o gasto de verdade do
 * cliente, não uma estimativa digitada.
 */
export function annualCardSpend(entries: FinanceEntry[], walletId: string, referenceDate: Date): Decimal {
  const windowStart = addMonths(referenceDate, -12);
  return entries
    .filter(
      (e) =>
        e.walletId === walletId &&
        e.nature === "DESPESA" &&
        isWithin(e.transactionDate, windowStart, referenceDate),
    )
    .reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0));
}

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
 * fechamento deste mês. Vencimento no `dueDay` — no MESMO mês do fechamento
 * quando `dueDay > closingDay` (ex.: fecha dia 2, vence dia 10 — o vencimento
 * já cai depois do fechamento sem precisar virar o mês); no mês SEGUINTE
 * quando `dueDay <= closingDay` (ex.: fecha dia 25, vence dia 10 — só existe
 * uma data assim no mês seguinte, já que dia 10 já passou neste mês).
 */
export function cardStatementWindow(
  config: CardConfig,
  closingYear: number,
  closingMonthIndex0: number,
): StatementWindow {
  const windowEnd = new Date(Date.UTC(closingYear, closingMonthIndex0, config.closingDay));
  const previousClosing = addMonths(windowEnd, -1);
  const windowStart = addDays(previousClosing, 1);
  const dueMonthIndex0 = config.dueDay > config.closingDay ? closingMonthIndex0 : closingMonthIndex0 + 1;
  const dueDate = new Date(Date.UTC(closingYear, dueMonthIndex0, config.dueDay));

  return { windowStart, windowEnd, dueDate };
}

/**
 * Generalização de `currentStatementWindow` para uma data de referência qualquer,
 * não só "hoje" — usada pela importação de OFX (§18), onde cada transação já tem
 * sua própria data histórica de compra e precisa da fatura que a contém, não da
 * fatura vigente no momento da importação.
 */
export function statementWindowForDate(config: CardConfig, referenceDate: Date): StatementWindow {
  const closingMonthIndex0 =
    referenceDate.getUTCDate() <= config.closingDay ? referenceDate.getUTCMonth() : referenceDate.getUTCMonth() + 1;
  return cardStatementWindow(config, referenceDate.getUTCFullYear(), closingMonthIndex0);
}

/**
 * §12 — "Vence = vencimento da fatura vigente se cartão de crédito", usado
 * pelo lançamento rápido. Se hoje ainda não passou do fechamento deste mês,
 * a fatura vigente é a que fecha este mês; senão, a do mês seguinte.
 */
export function currentStatementWindow(config: CardConfig, today: Date): StatementWindow {
  return statementWindowForDate(config, today);
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
