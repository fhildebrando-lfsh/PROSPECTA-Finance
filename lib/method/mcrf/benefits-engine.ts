import { Decimal } from "@/lib/finance/types";
import type { BenefitKind, RegimeTrabalho } from "@/app/generated/prisma/enums";

/**
 * §25 da especificação PROSPECTA-MCRF — proteções trabalhistas e
 * previdenciárias. Puro: recebe dado já buscado, nunca toca no Prisma.
 *
 * Duas regras governam este arquivo, e as duas existem para evitar que o motor
 * conte com dinheiro que não vai aparecer:
 *
 * 1. **"Ter direito" não basta** (§25). O recurso só entra no fluxo no mês em
 *    que razoavelmente estará disponível — rescisão que sai em 30 dias não
 *    paga o aluguel que vence em 5.
 * 2. **Regime importa** (§23). Militar e servidor estatutário não têm FGTS,
 *    seguro-desemprego nem verbas rescisórias de CLT. Presumir esses três para
 *    todo mundo daria a um policial uma proteção que ele não tem.
 */
export interface BenefitInput {
  kind: BenefitKind;
  /** Nulo = não confirmado. Nunca tratado como elegível (§8: dado ausente não vira fato). */
  isEligible: boolean | null;
  estimatedAmount: Decimal | null;
  durationMonths: number | null;
  availableAfterDays: number | null;
}

export interface BenefitCashflow {
  kind: BenefitKind;
  /** Mês do cenário em que o benefício começa a entrar. 0 = mês do evento. */
  startMonth: number;
  /** Quantos meses ele dura a partir de `startMonth`. */
  durationMonths: number;
  monthlyAmount: Decimal;
}

/**
 * §23 — benefícios que **não existem** para cada regime. Lista de exclusão, não
 * de inclusão: o que não está aqui é apenas "não presumido", e continua
 * dependendo de o usuário confirmar elegibilidade.
 */
const BENEFICIOS_INAPLICAVEIS: Partial<Record<RegimeTrabalho, BenefitKind[]>> = {
  MILITAR: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  SERVIDOR_EFETIVO: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  AUTONOMO: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  PROFISSIONAL_LIBERAL: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  MEI: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  EMPRESARIO: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  INFORMAL: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  APOSENTADO: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
  PENSIONISTA: ["FGTS", "SEGURO_DESEMPREGO", "VERBAS_RESCISORIAS"],
};

/**
 * O benefício se aplica a este regime? Falso apenas quando há incompatibilidade
 * conhecida — `null`/`OUTRO` devolve verdadeiro, porque desconhecer o regime
 * não é motivo para negar uma proteção que a pessoa pode ter.
 */
export function benefitAppliesTo(kind: BenefitKind, regime: RegimeTrabalho | null): boolean {
  if (!regime) return true;
  return !(BENEFICIOS_INAPLICAVEIS[regime] ?? []).includes(kind);
}

/** Dias → mês do cenário. 30 dias vira mês 1: o dinheiro não chega no mês do evento. */
function daysToScenarioMonth(days: number | null): number {
  if (!days || days <= 0) return 0;
  return Math.ceil(days / 30);
}

/**
 * Converte benefícios declarados no fluxo de caixa que o motor de cenários
 * consome. Entra **só** o que está confirmado como elegível, tem valor e é
 * compatível com o regime — qualquer dúvida deixa o benefício de fora, porque
 * superestimar proteção é o erro que torna uma reserva insuficiente.
 */
export function benefitCashflows(
  benefits: BenefitInput[],
  regime: RegimeTrabalho | null,
): BenefitCashflow[] {
  return benefits
    .filter((b) => b.isEligible === true)
    .filter((b) => b.estimatedAmount != null && b.estimatedAmount.greaterThan(0))
    .filter((b) => benefitAppliesTo(b.kind, regime))
    .map((b) => ({
      kind: b.kind,
      startMonth: daysToScenarioMonth(b.availableAfterDays),
      // Sem duração declarada, assume-se parcela única — nunca renda perpétua.
      durationMonths: b.durationMonths != null && b.durationMonths > 0 ? b.durationMonths : 1,
      monthlyAmount: b.estimatedAmount!,
    }));
}

/**
 * Quanto de benefício entra no caixa num mês específico do cenário. É a função
 * que o §33 chama para montar `AvailableBenefits_s,t`.
 */
export function benefitAmountForMonth(cashflows: BenefitCashflow[], month: number): Decimal {
  return cashflows
    .filter((c) => month >= c.startMonth && month < c.startMonth + c.durationMonths)
    .reduce((sum, c) => sum.plus(c.monthlyAmount), new Decimal(0));
}
