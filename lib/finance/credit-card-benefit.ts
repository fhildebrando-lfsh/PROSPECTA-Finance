import { Decimal } from "./types";

export interface BenefitInput {
  /** Gasto real em despesas dos últimos 12 meses no cartão (ver `annualCardSpend`). */
  annualSpend: Decimal;
  annualFee: Decimal;
  pointsPerRealSpent: Decimal;
  /** Quanto vale, em R$, cada ponto/milha no resgate. */
  pointValueEstimateBRL: Decimal;
}

export interface BenefitResult {
  pointsEarned: Decimal;
  benefitValue: Decimal;
  /** benefitValue − annualFee — positivo significa que o cartão compensa a anuidade. */
  netBenefit: Decimal;
}

/**
 * Cartões de Crédito → Análise de Benefícios: compara o que o cliente ganha
 * de pontos/milhas (sobre o gasto real, não uma promessa do banco) contra a
 * anuidade — o objetivo é evitar que uma taxa de pontos por R$ chamativa
 * esconda um resgate que vale pouco na prática.
 */
export function calculateCardBenefit(input: BenefitInput): BenefitResult {
  const pointsEarned = input.annualSpend.times(input.pointsPerRealSpent);
  const benefitValue = pointsEarned.times(input.pointValueEstimateBRL);
  const netBenefit = benefitValue.minus(input.annualFee);

  return { pointsEarned, benefitValue, netBenefit };
}
