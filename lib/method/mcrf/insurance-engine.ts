import { Decimal } from "@/lib/finance/types";

/**
 * §26 da especificação PROSPECTA-MCRF — proteção efetivamente aplicável.
 * Puro: recebe coberturas já buscadas, nunca toca no Prisma.
 *
 * A regra que governa este arquivo, e que a maioria das calculadoras erra:
 *
 * > **Nunca reduzir a reserva apenas porque existe uma apólice.**
 *
 * Uma apólice reduz a necessidade de liquidez só na medida do que ela paga, e
 * só **no mês em que o dinheiro chega**. Três coisas ficam de fora da proteção
 * e continuam sendo problema de caixa do cliente:
 *
 * 1. a **franquia**, que sai do bolso mesmo com cobertura;
 * 2. o que passar do **capital segurado**;
 * 3. **tudo**, se o evento acontecer dentro da carência.
 *
 * E há o efeito de tempo: uma indenização de R$ 30.000 que chega no terceiro
 * mês não paga a conta do primeiro. Por isso o resultado aqui não é um número
 * só — é um número **com o mês em que ele acontece**, para o motor de cenários
 * (§33) posicionar no fluxo.
 */
export interface CoverageInput {
  riskCovered: string;
  capitalInsured: Decimal | null;
  deductible: Decimal | null;
  waitingPeriodDays: number | null;
  payoutDelayDays: number | null;
  /** Dias entre a contratação e o evento simulado. Menor que a carência = sem cobertura. */
  daysSinceStart?: number | null;
}

export interface ProtectionResult {
  /** Quanto o seguro efetivamente paga. Zero quando não há cobertura aplicável. */
  payout: Decimal;
  /** Quanto continua sendo problema do cliente — franquia, excedente e o que a carência excluiu. */
  residualExposure: Decimal;
  /** Em que mês do cenário o `payout` entra no caixa. 0 = mês do evento. */
  payoutMonth: number;
  /** Verdadeiro quando o evento caiu dentro da carência — a apólice existe mas não vale para ele. */
  blockedByWaitingPeriod: boolean;
}

/** Dias → mês do cenário. 30 dias vira mês 1, porque o dinheiro não chega no mesmo mês. */
function daysToScenarioMonth(days: number | null): number {
  if (!days || days <= 0) return 0;
  return Math.ceil(days / 30);
}

/**
 * Aplica uma cobertura a uma perda bruta e devolve o que sobra descoberto.
 *
 * `grossLoss` é o custo financeiro do evento (conserto, despesa médica,
 * reposição). Quando a cobertura não se aplica — carência, ausência de capital
 * — a exposição residual é a perda inteira, nunca zero.
 */
export function applyCoverage(grossLoss: Decimal, coverage: CoverageInput): ProtectionResult {
  const zero = new Decimal(0);
  const loss = grossLoss.isNegative() ? zero : grossLoss;

  // Carência: a apólice existe, mas não vale para este evento.
  const withinWaiting =
    coverage.waitingPeriodDays != null &&
    coverage.daysSinceStart != null &&
    coverage.daysSinceStart < coverage.waitingPeriodDays;

  if (withinWaiting) {
    return { payout: zero, residualExposure: loss, payoutMonth: 0, blockedByWaitingPeriod: true };
  }

  const deductible = coverage.deductible ?? zero;
  // O que passa da franquia é o que a seguradora olha.
  const aboveDeductible = loss.minus(deductible);
  const claimable = aboveDeductible.isNegative() ? zero : aboveDeductible;

  // Capital segurado limita o pagamento; nulo = sem limite declarado.
  const payout = coverage.capitalInsured != null && claimable.greaterThan(coverage.capitalInsured)
    ? coverage.capitalInsured
    : claimable;

  return {
    payout,
    residualExposure: loss.minus(payout),
    payoutMonth: daysToScenarioMonth(coverage.payoutDelayDays),
    blockedByWaitingPeriod: false,
  };
}

/**
 * §26 — Exposição Financeira Residual quando várias coberturas podem incidir
 * sobre o mesmo evento. Aplica a melhor (maior pagamento), **não a soma**:
 * duas apólices para o mesmo risco não pagam em dobro, e somá-las produziria
 * a ilusão de estar protegido além do que se está.
 */
export function bestProtectionFor(grossLoss: Decimal, coverages: CoverageInput[]): ProtectionResult {
  if (coverages.length === 0) {
    return {
      payout: new Decimal(0),
      residualExposure: grossLoss.isNegative() ? new Decimal(0) : grossLoss,
      payoutMonth: 0,
      blockedByWaitingPeriod: false,
    };
  }

  return coverages
    .map((c) => applyCoverage(grossLoss, c))
    .reduce((best, current) => {
      if (current.payout.greaterThan(best.payout)) return current;
      // Empate no valor: vale mais o dinheiro que chega antes.
      if (current.payout.equals(best.payout) && current.payoutMonth < best.payoutMonth) return current;
      return best;
    });
}
