/**
 * Datas de lançamento são "date puro, sem fuso" (§15). Todas as funções
 * aqui tratam `Date` só pelos componentes de calendário em UTC — o "horário"
 * do objeto Date é ignorado. Construa datas com `Date.UTC(ano, mesIndex0, dia)`
 * (ou parse de string `AAAA-MM-DD`, que o JS já interpreta como UTC).
 */

function toUTCDateOnly(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function isBefore(a: Date, b: Date): boolean {
  return toUTCDateOnly(a) < toUTCDateOnly(b);
}

export function isSameOrBefore(a: Date, b: Date): boolean {
  return toUTCDateOnly(a) <= toUTCDateOnly(b);
}

export function isWithin(d: Date, start: Date, end: Date): boolean {
  return isSameOrBefore(start, d) && isSameOrBefore(d, end);
}

/** Dias de `from` até `to` (positivo se `to` é depois de `from`). */
export function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((toUTCDateOnly(to) - toUTCDateOnly(from)) / MS_PER_DAY);
}

export function addDays(d: Date, days: number): Date {
  return new Date(toUTCDateOnly(d) + days * 86_400_000);
}

/**
 * Soma meses preservando o dia quando possível, e travando no último dia do
 * mês de destino quando não (31/jan + 1 mês = 28 ou 29/fev, nunca 3/mar).
 * Necessário para parcelamento (§8.5) e fatura de cartão (§11.4).
 */
export function addMonths(d: Date, months: number): Date {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + months;
  const day = d.getUTCDate();
  const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfTargetMonth)));
}

/** Primeiro e último dia (inclusive) de um mês, em UTC. */
export function monthRange(year: number, monthIndex0: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, monthIndex0, 1)),
    end: new Date(Date.UTC(year, monthIndex0 + 1, 0)),
  };
}
