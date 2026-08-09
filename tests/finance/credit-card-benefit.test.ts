import { describe, expect, it } from "vitest";
import { calculateCardBenefit } from "@/lib/finance/credit-card-benefit";
import { d } from "./helpers";

describe("calculateCardBenefit (Cartões de Crédito — Análise de Benefícios)", () => {
  it("calcula pontos ganhos, valor do benefício e benefício líquido positivo", () => {
    const result = calculateCardBenefit({
      annualSpend: d(24000),
      annualFee: d(500),
      pointsPerRealSpent: d(2),
      pointValueEstimateBRL: d(0.02),
    });

    expect(result.pointsEarned.toNumber()).toBe(48000);
    expect(result.benefitValue.toNumber()).toBe(960);
    expect(result.netBenefit.toNumber()).toBe(460);
  });

  it("benefício líquido negativo quando a anuidade supera o valor resgatado", () => {
    const result = calculateCardBenefit({
      annualSpend: d(6000),
      annualFee: d(1200),
      pointsPerRealSpent: d(1),
      pointValueEstimateBRL: d(0.015),
    });

    expect(result.benefitValue.toNumber()).toBeCloseTo(90, 2);
    expect(result.netBenefit.isNegative()).toBe(true);
  });

  it("sem gasto no cartão, benefício líquido é só a anuidade negativa", () => {
    const result = calculateCardBenefit({
      annualSpend: d(0),
      annualFee: d(300),
      pointsPerRealSpent: d(2),
      pointValueEstimateBRL: d(0.02),
    });

    expect(result.pointsEarned.toNumber()).toBe(0);
    expect(result.netBenefit.toNumber()).toBe(-300);
  });
});
