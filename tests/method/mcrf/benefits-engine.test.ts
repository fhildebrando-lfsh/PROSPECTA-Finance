import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  benefitAppliesTo,
  benefitAmountForMonth,
  benefitCashflows,
  type BenefitInput,
} from "@/lib/method/mcrf/benefits-engine";

function beneficio(overrides: Partial<BenefitInput> = {}): BenefitInput {
  return {
    kind: "SEGURO_DESEMPREGO",
    isEligible: true,
    estimatedAmount: new Decimal(2000),
    durationMonths: 4,
    availableAfterDays: 30,
    ...overrides,
  };
}

describe("benefitAppliesTo", () => {
  /**
   * §23 — o erro que esta função existe para impedir: dar a um policial ou
   * servidor as proteções de um CLT, e com isso subdimensionar a reserva de
   * quem justamente não tem essa rede.
   */
  it("militar e servidor não têm FGTS, seguro-desemprego nem rescisão", () => {
    for (const regime of ["MILITAR", "SERVIDOR_EFETIVO"] as const) {
      expect(benefitAppliesTo("FGTS", regime)).toBe(false);
      expect(benefitAppliesTo("SEGURO_DESEMPREGO", regime)).toBe(false);
      expect(benefitAppliesTo("VERBAS_RESCISORIAS", regime)).toBe(false);
    }
  });

  it("mas continuam tendo licença estatutária e proteção por incapacidade", () => {
    expect(benefitAppliesTo("LICENCA_ESTATUTARIA", "MILITAR")).toBe(true);
    expect(benefitAppliesTo("APOSENTADORIA_INVALIDEZ", "SERVIDOR_EFETIVO")).toBe(true);
  });

  it("CLT tem as três proteções típicas", () => {
    expect(benefitAppliesTo("FGTS", "CLT")).toBe(true);
    expect(benefitAppliesTo("SEGURO_DESEMPREGO", "CLT")).toBe(true);
    expect(benefitAppliesTo("VERBAS_RESCISORIAS", "CLT")).toBe(true);
  });

  it("autônomo, MEI e empresário não têm as proteções de vínculo", () => {
    for (const regime of ["AUTONOMO", "MEI", "EMPRESARIO", "INFORMAL"] as const) {
      expect(benefitAppliesTo("SEGURO_DESEMPREGO", regime)).toBe(false);
    }
  });

  it("regime desconhecido não nega proteção — desconhecer não é negar", () => {
    expect(benefitAppliesTo("FGTS", null)).toBe(true);
  });
});

describe("benefitCashflows", () => {
  it("só entra o que foi confirmado como elegível", () => {
    const flows = benefitCashflows(
      [beneficio({ isEligible: null }), beneficio({ isEligible: false }), beneficio({ isEligible: true })],
      "CLT",
    );
    expect(flows).toHaveLength(1);
  });

  it("benefício sem valor declarado não entra — não dá pra contar com número que não existe", () => {
    expect(benefitCashflows([beneficio({ estimatedAmount: null })], "CLT")).toHaveLength(0);
    expect(benefitCashflows([beneficio({ estimatedAmount: new Decimal(0) })], "CLT")).toHaveLength(0);
  });

  it("descarta o benefício incompatível com o regime mesmo se marcado elegível", () => {
    // Proteção contra erro de cadastro: alguém marca FGTS num militar por engano.
    const flows = benefitCashflows([beneficio({ kind: "FGTS" })], "MILITAR");
    expect(flows).toHaveLength(0);
  });

  it("posiciona o benefício no mês em que o dinheiro chega", () => {
    const [f] = benefitCashflows([beneficio({ availableAfterDays: 45 })], "CLT");
    expect(f.startMonth).toBe(2);
  });

  it("sem duração declarada assume parcela única, nunca renda perpétua", () => {
    const [f] = benefitCashflows([beneficio({ durationMonths: null })], "CLT");
    expect(f.durationMonths).toBe(1);
  });
});

describe("benefitAmountForMonth", () => {
  it("entra só na janela em que o benefício está ativo", () => {
    // Seguro-desemprego: R$ 2.000 por 4 meses, disponível a partir do mês 1.
    const flows = benefitCashflows([beneficio({ availableAfterDays: 30, durationMonths: 4 })], "CLT");

    expect(benefitAmountForMonth(flows, 0).toString()).toBe("0"); // ainda não chegou
    expect(benefitAmountForMonth(flows, 1).toString()).toBe("2000");
    expect(benefitAmountForMonth(flows, 4).toString()).toBe("2000");
    expect(benefitAmountForMonth(flows, 5).toString()).toBe("0"); // acabou
  });

  it("soma benefícios simultâneos", () => {
    const flows = benefitCashflows(
      [
        beneficio({ kind: "SEGURO_DESEMPREGO", availableAfterDays: 0, estimatedAmount: new Decimal(2000) }),
        beneficio({ kind: "FGTS", availableAfterDays: 0, estimatedAmount: new Decimal(5000), durationMonths: 1 }),
      ],
      "CLT",
    );
    expect(benefitAmountForMonth(flows, 0).toString()).toBe("7000");
    expect(benefitAmountForMonth(flows, 1).toString()).toBe("2000");
  });

  it("sem benefício nenhum devolve zero, não quebra", () => {
    expect(benefitAmountForMonth([], 3).toString()).toBe("0");
  });
});
