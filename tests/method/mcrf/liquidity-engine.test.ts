import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  classifyLiquidity,
  coberturaEmMeses,
  computeEmergencyLiquidity,
  eligibilityFactor,
  type LiquidityItem,
} from "@/lib/method/mcrf/liquidity-engine";

function item(value: number, classe: LiquidityItem["classe"], id = `i-${value}-${classe}`): LiquidityItem {
  return { id, name: id, value: new Decimal(value), classe };
}

describe("classifyLiquidity", () => {
  it("crédito tem precedência sobre qualquer classificação — cartão nunca vira reserva", () => {
    expect(classifyLiquidity({ funcao: "PROTECAO", isLiability: true })).toBe("CREDITO");
  });

  it("reaproveita a função patrimonial da Etapa 7", () => {
    expect(classifyLiquidity({ funcao: "PROTECAO" })).toBe("IMEDIATA");
    expect(classifyLiquidity({ funcao: "LIQUIDEZ_OPERACIONAL" })).toBe("IMEDIATA");
    expect(classifyLiquidity({ funcao: "CRESCIMENTO" })).toBe("SECUNDARIA");
    expect(classifyLiquidity({ funcao: "OBJETIVOS" })).toBe("ESTRATEGICO");
    expect(classifyLiquidity({ funcao: "LONGEVIDADE" })).toBe("ESTRATEGICO");
    expect(classifyLiquidity({ funcao: "USO" })).toBe("ILIQUIDO");
  });

  it("sem função, cai no tipo da carteira", () => {
    expect(classifyLiquidity({ funcao: null, walletKindCode: "CONTA_BANCARIA" })).toBe("IMEDIATA");
    expect(classifyLiquidity({ funcao: null, walletKindCode: "CONTA_INVESTIMENTO" })).toBe("SECUNDARIA");
    expect(classifyLiquidity({ funcao: null, walletKindCode: "VOUCHER" })).toBe("RESTRITA");
    expect(classifyLiquidity({ funcao: null, walletKindCode: "CONTA_RECEBIVEL" })).toBe("ILIQUIDO");
  });

  it("sem função nem tipo conhecido, assume estratégico — o conservador", () => {
    // Contar como imediato o que ninguém classificou inflaria a reserva
    // disponível e faria a pessoa se achar mais protegida do que está.
    expect(classifyLiquidity({ funcao: null, walletKindCode: "DESCONHECIDO" })).toBe("ESTRATEGICO");
  });

  it("bem físico é ilíquido", () => {
    expect(classifyLiquidity({ funcao: null, isPhysicalAsset: true })).toBe("ILIQUIDO");
  });
});

describe("eligibilityFactor", () => {
  /**
   * Correção do modelo de §30: o produto puro de três fatores de 0,8 daria
   * 0,51 e destruiria metade da elegibilidade de um ativo levemente restrito.
   */
  it("nunca fica pior que o pior fator isolado", () => {
    const f = eligibilityFactor({ liquidez: 0.8, estabilidade: 0.8, disponibilidade: 0.8 });
    expect(f).toBeCloseTo(0.8, 6); // produto seria 0.512
  });

  it("fator zero zera tudo — crédito não vira reserva por composição", () => {
    expect(eligibilityFactor({ liquidez: 0, estabilidade: 0, disponibilidade: 0 })).toBe(0);
  });

  it("tudo livre e líquido vale integral", () => {
    expect(eligibilityFactor({ liquidez: 1, estabilidade: 1, disponibilidade: 1 })).toBe(1);
  });
});

describe("computeEmergencyLiquidity", () => {
  it("liquidez imediata conta integralmente", () => {
    const r = computeEmergencyLiquidity([item(10000, "IMEDIATA")]);
    expect(r.eligibleValue.toString()).toBe("10000");
  });

  it("crédito não entra na reserva e é mostrado em separado", () => {
    const r = computeEmergencyLiquidity([item(5000, "IMEDIATA"), item(20000, "CREDITO")]);
    expect(r.eligibleValue.toString()).toBe("5000");
    expect(r.creditoDisponivel.toString()).toBe("20000");
  });

  it("imóvel não paga a conta do mês que vem — ilíquido não é elegível", () => {
    const r = computeEmergencyLiquidity([item(500000, "ILIQUIDO")]);
    expect(r.eligibleValue.toString()).toBe("0");
    // mas continua visível no bruto, porque §55 exige tratá-lo em separado
    expect(r.grossValue.toString()).toBe("500000");
  });

  it("comprometido com outro objetivo entra pouco, não zero", () => {
    // Usar a entrada da casa numa emergência é possível, mas tem custo real.
    const r = computeEmergencyLiquidity([item(100000, "ESTRATEGICO")]);
    expect(r.eligibleValue.toString()).toBe("20000");
  });

  it("voucher tem uso restrito e entra pela metade", () => {
    const r = computeEmergencyLiquidity([item(1000, "RESTRITA")]);
    expect(r.eligibleValue.toString()).toBe("500");
  });

  it("saldo negativo não vira reserva ao ser multiplicado por um fator", () => {
    const r = computeEmergencyLiquidity([item(-3000, "IMEDIATA"), item(5000, "IMEDIATA")]);
    expect(r.eligibleValue.toString()).toBe("5000"); // só o positivo é elegível
    expect(r.grossValue.toString()).toBe("2000"); // mas o bruto mostra a verdade
  });

  it("a diferença entre bruto e elegível é o que a pessoa acha que tem e não tem", () => {
    const r = computeEmergencyLiquidity([
      item(10000, "IMEDIATA"),
      item(300000, "ILIQUIDO"),
      item(50000, "CREDITO"),
    ]);
    expect(r.grossValue.toString()).toBe("360000");
    expect(r.eligibleValue.toString()).toBe("10000");
  });

  it("devolve as 6 classes sempre, mesmo vazias", () => {
    const r = computeEmergencyLiquidity([]);
    expect(r.porClasse).toHaveLength(6);
    expect(r.eligibleValue.toString()).toBe("0");
  });
});

describe("coberturaEmMeses", () => {
  it("quantos meses do custo essencial a reserva cobre", () => {
    expect(coberturaEmMeses(new Decimal(30000), new Decimal(5000))).toBe(6);
  });

  it("sem custo essencial não há cobertura calculável — null, nunca zero", () => {
    expect(coberturaEmMeses(new Decimal(30000), new Decimal(0))).toBeNull();
  });
});
