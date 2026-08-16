import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  computeIprf,
  margemIncerteza,
  pisoLiquidezImediata,
  principaisFatores,
  recommendReserve,
  type MargemInput,
} from "@/lib/method/mcrf/reserve-engine";
import type { ScenarioResult } from "@/lib/method/mcrf/scenario-engine";

function cenario(id: string, need: number, isMaterial = true): ScenarioResult {
  return {
    id: id as ScenarioResult["id"],
    label: `Cenário ${id}`,
    need: new Decimal(need),
    immediateOutOfPocket: new Decimal(0),
    worstMonth: 1,
    flows: [],
    isMaterial,
    rationale: "",
  };
}

describe("pisoLiquidezImediata", () => {
  it("nunca é um valor fixo — sai do custo de contingência da própria pessoa", () => {
    expect(pisoLiquidezImediata(new Decimal(3000), new Decimal(0)).toString()).toBe("9000");
    expect(pisoLiquidezImediata(new Decimal(8000), new Decimal(0)).toString()).toBe("24000");
  });

  it("uma franquia alta eleva o piso acima dos três meses", () => {
    // 3 meses = 9.000, mas uma franquia de 20.000 exige mais liquidez imediata.
    expect(pisoLiquidezImediata(new Decimal(3000), new Decimal(20000)).toString()).toBe("23000");
  });
});

describe("margemIncerteza", () => {
  function input(overrides: Partial<MargemInput> = {}): MargemInput {
    return {
      confiancaDespesa: "MUITO_ALTA",
      confiancaRenda: "MUITO_ALTA",
      temSeguroNaoConfirmado: false,
      temBeneficioIncerto: false,
      rendaAltamenteVolatil: false,
      ...overrides,
    };
  }

  it("perfil completo e histórico longo não recebe margem nenhuma", () => {
    expect(margemIncerteza(input())).toBe(0);
  });

  /**
   * A margem é honestidade, não conservadorismo gratuito: quem preenche mais o
   * perfil recebe recomendação menor, e é assim que deve ser.
   */
  it("cresce conforme a confiança cai", () => {
    const alta = margemIncerteza(input({ confiancaDespesa: "ALTA" }));
    const moderada = margemIncerteza(input({ confiancaDespesa: "MODERADA" }));
    const baixa = margemIncerteza(input({ confiancaDespesa: "BAIXA" }));
    expect(moderada).toBeGreaterThan(alta);
    expect(baixa).toBeGreaterThan(moderada);
  });

  it("seguro e benefício não confirmados aumentam a margem", () => {
    expect(margemIncerteza(input({ temSeguroNaoConfirmado: true }))).toBeGreaterThan(margemIncerteza(input()));
    expect(margemIncerteza(input({ temBeneficioIncerto: true }))).toBeGreaterThan(margemIncerteza(input()));
  });

  it("tem teto — a margem não pode virar o cálculo", () => {
    const pior = margemIncerteza({
      confiancaDespesa: "BAIXA",
      confiancaRenda: "BAIXA",
      temSeguroNaoConfirmado: true,
      temBeneficioIncerto: true,
      rendaAltamenteVolatil: true,
    });
    expect(pior).toBeLessThanOrEqual(0.35);
  });
});

describe("recommendReserve", () => {
  it("usa o pior cenário material quando ele supera o piso", () => {
    const r = recommendReserve({
      pli: new Decimal(9000),
      scenarios: [cenario("B", 40000), cenario("C25", 5000)],
      margem: 0,
      reservaAtualElegivel: new Decimal(0),
    });
    expect(r.protecaoRecomendada.toString()).toBe("40000");
    expect(r.cenarioDeterminante?.id).toBe("B");
  });

  it("usa o piso quando nenhum cenário o supera — ninguém fica sem liquidez mínima", () => {
    const r = recommendReserve({
      pli: new Decimal(15000),
      scenarios: [cenario("C25", 2000)],
      margem: 0,
      reservaAtualElegivel: new Decimal(0),
    });
    expect(r.protecaoRecomendada.toString()).toBe("15000");
  });

  /** §23 — o cenário não material é calculado, mas não determina a recomendação. */
  it("ignora cenário não material por mais severo que seja", () => {
    const r = recommendReserve({
      pli: new Decimal(1000),
      scenarios: [cenario("B", 90000, false), cenario("D", 20000, true)],
      margem: 0,
      reservaAtualElegivel: new Decimal(0),
    });
    expect(r.protecaoRecomendada.toString()).toBe("20000");
    expect(r.cenarioDeterminante?.id).toBe("D");
  });

  /**
   * Divergência 5 da análise: os três níveis precisam ser distintos. Se a
   * Reforçada empatasse com a Recomendada, o terceiro nível não existiria.
   */
  it("os três níveis são estritamente crescentes", () => {
    const r = recommendReserve({
      pli: new Decimal(9000),
      scenarios: [cenario("H", 50000)],
      margem: 0.1,
      reservaAtualElegivel: new Decimal(0),
    });
    expect(r.protecaoEssencial.lessThan(r.protecaoRecomendada)).toBe(true);
    expect(r.protecaoRecomendada.lessThan(r.protecaoReforcada)).toBe(true);
  });

  it("a margem eleva a recomendação proporcionalmente", () => {
    const sem = recommendReserve({
      pli: new Decimal(0),
      scenarios: [cenario("B", 10000)],
      margem: 0,
      reservaAtualElegivel: new Decimal(0),
    });
    const com = recommendReserve({
      pli: new Decimal(0),
      scenarios: [cenario("B", 10000)],
      margem: 0.2,
      reservaAtualElegivel: new Decimal(0),
    });
    expect(sem.protecaoRecomendada.toString()).toBe("10000");
    expect(com.protecaoRecomendada.toString()).toBe("12000");
  });

  it("calcula progresso e o quanto falta", () => {
    const r = recommendReserve({
      pli: new Decimal(0),
      scenarios: [cenario("B", 40000)],
      margem: 0,
      reservaAtualElegivel: new Decimal(10000),
    });
    expect(r.progressoPct).toBe(25);
    expect(r.faltaConstruir.toString()).toBe("30000");
  });

  it("reserva acima da meta trava em 100% e não devolve falta negativa", () => {
    const r = recommendReserve({
      pli: new Decimal(0),
      scenarios: [cenario("B", 10000)],
      margem: 0,
      reservaAtualElegivel: new Decimal(25000),
    });
    expect(r.progressoPct).toBe(100);
    expect(r.faltaConstruir.toString()).toBe("0");
  });

  it("registra a versão da metodologia que produziu o número (§48)", () => {
    const r = recommendReserve({
      pli: new Decimal(1),
      scenarios: [],
      margem: 0,
      reservaAtualElegivel: new Decimal(0),
    });
    expect(r.methodologyVersion).toBe("PROSPECTA-MCRF-1.0");
  });
});

describe("computeIprf", () => {
  const base = {
    adequacaoLiquidez: 1,
    continuidadeRenda: 1,
    concentracaoRenda: 0,
    rigidezPct: 0,
    ipp: 100,
    coberturaSeguros: 1,
  };

  it("perfil ideal chega perto de 100", () => {
    expect(computeIprf(base).score).toBe(100);
  });

  it("perfil frágil fica perto de zero", () => {
    expect(
      computeIprf({
        adequacaoLiquidez: 0,
        continuidadeRenda: 0,
        concentracaoRenda: 1,
        rigidezPct: 100,
        ipp: 0,
        coberturaSeguros: 0,
      }).score,
    ).toBe(0);
  });

  it("concentração e rigidez são invertidas — quanto maiores, pior", () => {
    const concentrado = computeIprf({ ...base, concentracaoRenda: 1 }).score;
    const rigido = computeIprf({ ...base, rigidezPct: 100 }).score;
    expect(concentrado).toBeLessThan(100);
    expect(rigido).toBeLessThan(100);
  });

  it("dado ausente vira meio-termo, não zero — desconhecer não é condenar", () => {
    const semDado = computeIprf({ ...base, concentracaoRenda: null, rigidezPct: null }).score;
    const pior = computeIprf({ ...base, concentracaoRenda: 1, rigidezPct: 100 }).score;
    expect(semDado).toBeGreaterThan(pior);
  });

  it("devolve os componentes para a tela poder decompor", () => {
    const r = computeIprf(base);
    expect(r.componentes).toHaveLength(6);
    expect(r.componentes.reduce((s, c) => s + c.peso, 0)).toBe(100);
  });
});

describe("principaisFatores", () => {
  it("explica em linguagem de gente e limita a 5", () => {
    const rec = recommendReserve({
      pli: new Decimal(0),
      scenarios: [cenario("H", 50000)],
      margem: 0.2,
      reservaAtualElegivel: new Decimal(0),
    });
    const iprf = computeIprf({
      adequacaoLiquidez: 0.1,
      continuidadeRenda: 0.2,
      concentracaoRenda: 1,
      rigidezPct: 90,
      ipp: 10,
      coberturaSeguros: 0,
    });

    const fatores = principaisFatores(rec, iprf, {
      correlacaoAlta: true,
      semSegundaAtividade: true,
      semSeguro: true,
    });

    expect(fatores.length).toBeGreaterThan(0);
    expect(fatores.length).toBeLessThanOrEqual(5);
    expect(fatores[0]).toContain("Cenário H");
  });
});
