import { Decimal, type EntryStatus } from "./types";

/**
 * Subconjunto de `Entry` (não `FinanceEntry`, deliberadamente enxuto) com só
 * o que "Patrimônio" (Fase 3, §7.4) precisa. Mesmo padrão de `InstallmentEntry`
 * em `open-installments.ts` — escopo local, não infla o contrato compartilhado.
 */
export interface AssetValuationEntry {
  id: string;
  assetId: string | null;
  amount: Decimal;
  status: EntryStatus;
}

/**
 * Valor atual de um bem = soma de todas as entries ligadas a ele (aquisição +
 * valorizações/desvalorizações, cada uma com seu sinal — §8.3). Nunca
 * armazenado, sempre derivado — mesmo princípio de "campo calculado nunca
 * persiste" (§8.1). O chamador já filtra `entries` pelo `assetId` desejado
 * (mesmo padrão de `walletBalance`, que recebe todas as entries e filtra por
 * dentro — aqui a filtragem por `assetId` fica a cargo de quem monta a lista,
 * já que a query real (Prisma) já busca só as entries daquele bem).
 */
export function assetCurrentValue(entries: AssetValuationEntry[]): Decimal {
  return entries.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
}

export interface PatrimonyEvolutionPoint {
  date: Date;
  /** Patrimônio total acumulado até e incluindo esta data. */
  cumulative: Decimal;
}

/**
 * Evolução do patrimônio total (todos os bens combinados) ao longo do tempo —
 * um ponto por lançamento (aquisição/valorização/desvalorização), ordenado
 * cronologicamente, com soma corrida. Diferente de `monthlySeries` (Fase 2):
 * aqui é "valor acumulado e data" por evento real, não uma série mensal fixa
 * — o número de eventos de patrimônio costuma ser pequeno o bastante para
 * cada um valer seu próprio ponto no gráfico.
 */
export function patrimonyEvolution(entries: (AssetValuationEntry & { date: Date })[]): PatrimonyEvolutionPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  let running = new Decimal(0);
  return sorted.map((e) => {
    running = running.plus(e.amount);
    return { date: e.date, cumulative: running };
  });
}
