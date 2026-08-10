import { Decimal } from "./types";

/**
 * Subconjunto de `Entry` com só o que os cálculos de Investimentos precisam
 * (mesmo padrão enxuto de `AssetValuationEntry` em `patrimony.ts`). O
 * chamador já filtra por `investmentId` — a query real (Prisma) busca só as
 * entries daquela posição.
 */
export interface InvestmentPositionEntry {
  amount: Decimal;
  /** Slug da categoria do lançamento (Aportes/Ganho de Capital/Perdas/
   * Dividendos/Juros/Retiradas/Impostos/Câmbio) — usado só pra separar
   * "quanto foi aportado" do resto da posição. */
  categorySlug: string;
}

const APORTE_SLUG = "aportes";

/**
 * Valor atual da posição = soma de tudo que ficou ligado a ela (aporte +
 * ganho de capital − perdas − retiradas + dividendo/juro reinvestido, cada
 * um já com seu sinal, §8.3) — mesmo princípio de `assetCurrentValue`: nunca
 * armazenado, sempre derivado.
 */
export function investmentPositionValue(entries: InvestmentPositionEntry[]): Decimal {
  return entries.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
}

/** Quanto foi realmente aportado (só as entradas de categoria "Aportes") — a base de custo. */
export function investmentAcquisitionValue(entries: InvestmentPositionEntry[]): Decimal {
  return entries
    .filter((e) => e.categorySlug === APORTE_SLUG)
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
}

/** Ganho de capital = valor atual da posição − o que foi aportado. */
export function investmentGainLoss(entries: InvestmentPositionEntry[]): Decimal {
  return investmentPositionValue(entries).minus(investmentAcquisitionValue(entries));
}

/** Rentabilidade (%) — ganho de capital sobre o que foi aportado. Zero se nada foi aportado ainda. */
export function investmentReturnPct(entries: InvestmentPositionEntry[]): Decimal {
  const acquisition = investmentAcquisitionValue(entries);
  if (acquisition.isZero()) return new Decimal(0);
  return investmentGainLoss(entries).div(acquisition).times(100);
}

/** Renda real recebida (aluguel, distribuição de lucro) — soma de `Entry` nature=RECEITA
 * ligadas à posição, numa carteira de verdade (fora da posição em si). */
export function investmentIncomeTotal(incomeEntries: { amount: Decimal }[]): Decimal {
  return incomeEntries.reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
}

/**
 * Retorno total (%) — termo real de mercado: ganho de capital + renda recebida,
 * sobre o que foi aportado. Zero se nada foi aportado ainda.
 */
export function investmentTotalReturnPct(
  entries: InvestmentPositionEntry[],
  incomeEntries: { amount: Decimal }[],
): Decimal {
  const acquisition = investmentAcquisitionValue(entries);
  if (acquisition.isZero()) return new Decimal(0);
  const totalReturn = investmentGainLoss(entries).plus(investmentIncomeTotal(incomeEntries));
  return totalReturn.div(acquisition).times(100);
}

export interface PortfolioAllocationInput {
  classCode: string;
  classLabel: string;
  currentValue: Decimal;
}

export interface PortfolioAllocationSlice {
  classCode: string;
  classLabel: string;
  value: Decimal;
  /** % do total da carteira — 0 se a carteira toda estiver zerada. */
  percentage: Decimal;
}

/** Alocação da carteira por classe de investimento — agrupa e soma o valor atual de cada
 * posição por `classCode`, com o percentual sobre o total. */
export function portfolioAllocation(investments: PortfolioAllocationInput[]): PortfolioAllocationSlice[] {
  const total = investments.reduce((sum, i) => sum.plus(i.currentValue), new Decimal(0));

  const byClass = new Map<string, { classLabel: string; value: Decimal }>();
  for (const inv of investments) {
    const current = byClass.get(inv.classCode) ?? { classLabel: inv.classLabel, value: new Decimal(0) };
    current.value = current.value.plus(inv.currentValue);
    byClass.set(inv.classCode, current);
  }

  return Array.from(byClass.entries()).map(([classCode, { classLabel, value }]) => ({
    classCode,
    classLabel,
    value,
    percentage: total.isZero() ? new Decimal(0) : value.div(total).times(100),
  }));
}

// `InvestmentDetails`/`INSTRUMENT_SUGGESTIONS_BY_CLASS`/`DETAIL_FIELDS_BY_CLASS` moram
// em `investment-instruments.ts` (sem import de Decimal) porque o formulário de
// cadastro/edição de investimento (Client Component) precisa deles — importar daqui
// arrastaria o `Decimal` deste módulo pro bundle do navegador (mesmo cuidado já
// documentado em `lib/import/pdf-statement/types.ts`).
export type { InvestmentDetails, InvestmentDetailField } from "./investment-instruments";
export { INSTRUMENT_SUGGESTIONS_BY_CLASS, DETAIL_FIELDS_BY_CLASS } from "./investment-instruments";
