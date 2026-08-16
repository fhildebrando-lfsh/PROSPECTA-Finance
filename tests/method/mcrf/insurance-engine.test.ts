import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import { applyCoverage, bestProtectionFor, type CoverageInput } from "@/lib/method/mcrf/insurance-engine";

function cobertura(overrides: Partial<CoverageInput> = {}): CoverageInput {
  return {
    riskCovered: "colisão",
    capitalInsured: null,
    deductible: null,
    waitingPeriodDays: null,
    payoutDelayDays: null,
    daysSinceStart: null,
    ...overrides,
  };
}

describe("applyCoverage", () => {
  it("a franquia continua saindo do bolso — ter seguro não zera a necessidade de caixa", () => {
    const r = applyCoverage(new Decimal(10000), cobertura({ deductible: new Decimal(2500) }));
    expect(r.payout.toString()).toBe("7500");
    expect(r.residualExposure.toString()).toBe("2500");
  });

  it("perda menor que a franquia não gera pagamento nenhum", () => {
    const r = applyCoverage(new Decimal(1500), cobertura({ deductible: new Decimal(2500) }));
    expect(r.payout.toString()).toBe("0");
    expect(r.residualExposure.toString()).toBe("1500");
  });

  it("o que passa do capital segurado fica descoberto", () => {
    const r = applyCoverage(new Decimal(80000), cobertura({ capitalInsured: new Decimal(50000) }));
    expect(r.payout.toString()).toBe("50000");
    expect(r.residualExposure.toString()).toBe("30000");
  });

  it("dentro da carência a apólice existe mas não vale — exposição é a perda inteira", () => {
    const r = applyCoverage(
      new Decimal(10000),
      cobertura({ waitingPeriodDays: 90, daysSinceStart: 30, capitalInsured: new Decimal(50000) }),
    );
    expect(r.blockedByWaitingPeriod).toBe(true);
    expect(r.payout.toString()).toBe("0");
    expect(r.residualExposure.toString()).toBe("10000");
  });

  it("passada a carência, a mesma cobertura passa a valer", () => {
    const r = applyCoverage(
      new Decimal(10000),
      cobertura({ waitingPeriodDays: 90, daysSinceStart: 120, capitalInsured: new Decimal(50000) }),
    );
    expect(r.blockedByWaitingPeriod).toBe(false);
    expect(r.payout.toString()).toBe("10000");
  });

  /**
   * O ponto central de §33: a indenização tem data. Uma que chega no 3º mês não
   * paga a conta do 1º, e é isso que separa uma reserva que funciona de uma que
   * só parece suficiente na planilha.
   */
  it("posiciona a indenização no mês em que ela realmente chega", () => {
    expect(applyCoverage(new Decimal(1000), cobertura({ payoutDelayDays: null })).payoutMonth).toBe(0);
    expect(applyCoverage(new Decimal(1000), cobertura({ payoutDelayDays: 30 })).payoutMonth).toBe(1);
    expect(applyCoverage(new Decimal(1000), cobertura({ payoutDelayDays: 75 })).payoutMonth).toBe(3);
  });

  it("sem franquia nem capital declarados, cobre a perda inteira", () => {
    const r = applyCoverage(new Decimal(4000), cobertura());
    expect(r.payout.toString()).toBe("4000");
    expect(r.residualExposure.toString()).toBe("0");
  });

  it("perda negativa não vira pagamento", () => {
    const r = applyCoverage(new Decimal(-500), cobertura());
    expect(r.payout.toString()).toBe("0");
    expect(r.residualExposure.toString()).toBe("0");
  });
});

describe("bestProtectionFor", () => {
  it("sem cobertura nenhuma, a perda inteira fica descoberta", () => {
    const r = bestProtectionFor(new Decimal(9000), []);
    expect(r.payout.toString()).toBe("0");
    expect(r.residualExposure.toString()).toBe("9000");
  });

  it("duas apólices para o mesmo risco não pagam em dobro — vale a melhor", () => {
    const r = bestProtectionFor(new Decimal(10000), [
      cobertura({ deductible: new Decimal(5000) }),
      cobertura({ deductible: new Decimal(1000) }),
    ]);
    // Somar daria 13.000 de pagamento para uma perda de 10.000 — proteção fantasma.
    expect(r.payout.toString()).toBe("9000");
    expect(r.residualExposure.toString()).toBe("1000");
  });

  it("empate no valor: ganha o dinheiro que chega antes", () => {
    const r = bestProtectionFor(new Decimal(5000), [
      cobertura({ payoutDelayDays: 90 }),
      cobertura({ payoutDelayDays: 15 }),
    ]);
    expect(r.payoutMonth).toBe(1);
  });

  it("ignora a cobertura bloqueada por carência e usa a que vale", () => {
    const r = bestProtectionFor(new Decimal(8000), [
      cobertura({ waitingPeriodDays: 180, daysSinceStart: 10 }),
      cobertura({ deductible: new Decimal(1000) }),
    ]);
    expect(r.payout.toString()).toBe("7000");
    expect(r.blockedByWaitingPeriod).toBe(false);
  });
});
