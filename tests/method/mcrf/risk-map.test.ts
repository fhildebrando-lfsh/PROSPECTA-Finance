import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  COBERTURA_POR_CENARIO,
  buildRiskMap,
  summarizeRiskMap,
  type PolicyCoverage,
} from "@/lib/method/mcrf/risk-map";
import type { ScenarioId, ScenarioResult } from "@/lib/method/mcrf/scenario-engine";

function cenario(id: ScenarioId, need: number, isMaterial = true): ScenarioResult {
  return {
    id,
    label: `Cenário ${id}`,
    need: new Decimal(need),
    isMaterial,
    worstMonth: 1,
    flows: [],
    explicacao: "",
  } as unknown as ScenarioResult;
}

function cobertura(over: Partial<PolicyCoverage> = {}): PolicyCoverage {
  return {
    policyKind: "PROTECAO_RENDA",
    policyName: "Apólice X",
    riskCovered: "perda de renda",
    capitalInsured: new Decimal(10000),
    deductible: null,
    waitingPeriodDays: null,
    payoutDelayDays: null,
    ...over,
  };
}

describe("mapa cenário → tipo de seguro", () => {
  it("cobre todos os dez cenários, sem buraco", () => {
    const ids: ScenarioId[] = ["A", "B", "C25", "C50", "C75", "D", "E", "F", "G", "H"];
    for (const id of ids) {
      expect(COBERTURA_POR_CENARIO[id], id).toBeDefined();
    }
  });

  /**
   * Lista vazia é conclusão, não lacuna: "não há seguro para isto, a resposta é
   * liquidez" é uma resposta do método.
   */
  it("volatilidade do próprio histórico não é transferível por seguro", () => {
    expect(COBERTURA_POR_CENARIO.A).toEqual([]);
  });

  /**
   * Os cenários medem a liquidez que o **próprio cliente** precisaria; morte do
   * titular é problema de quem fica, que é outra pergunta. Forçar VIDA a cobrir
   * um cenário daria impressão de proteção onde não há.
   */
  it("seguro de vida não é forçado a cobrir nenhum cenário de liquidez", () => {
    const todos = Object.values(COBERTURA_POR_CENARIO).flat();
    expect(todos).not.toContain("VIDA");
    expect(todos).not.toContain("ODONTOLOGICO");
  });
});

describe("buildRiskMap", () => {
  it("só entra cenário material", () => {
    const rows = buildRiskMap([cenario("B", 10000), cenario("E", 5000, false)], []);
    expect(rows.map((r) => r.scenarioId)).toEqual(["B"]);
  });

  it("sem seguro aplicável, o residual é a necessidade inteira", () => {
    const rows = buildRiskMap([cenario("B", 10000)], []);
    expect(rows[0].residual.toFixed(2)).toBe("10000.00");
    expect(rows[0].cobertoPorSeguro.toFixed(2)).toBe("0.00");
    expect(rows[0].tratamento).toBe("TRANSFERIR");
  });

  it("apólice de tipo que não cobre o cenário é ignorada", () => {
    // Seguro residencial não protege interrupção de renda.
    const rows = buildRiskMap([cenario("B", 10000)], [cobertura({ policyKind: "RESIDENCIAL" })]);
    expect(rows[0].cobertoPorSeguro.toFixed(2)).toBe("0.00");
    expect(rows[0].apolicesAplicaveis).toEqual([]);
  });

  it("cobertura suficiente zera o residual e o risco fica coberto", () => {
    const rows = buildRiskMap(
      [cenario("B", 8000)],
      [cobertura({ capitalInsured: new Decimal(20000) })],
    );
    expect(rows[0].residual.toFixed(2)).toBe("0.00");
    expect(rows[0].tratamento).toBe("COBERTO");
  });

  it("cobertura parcial pede complemento, não nova transferência", () => {
    const rows = buildRiskMap(
      [cenario("B", 30000)],
      [cobertura({ capitalInsured: new Decimal(10000) })],
    );
    expect(rows[0].cobertoPorSeguro.toFixed(2)).toBe("10000.00");
    expect(rows[0].residual.toFixed(2)).toBe("20000.00");
    expect(rows[0].tratamento).toBe("COMPLEMENTAR");
  });

  /**
   * O ponto que justifica reaproveitar `bestProtectionFor` em vez de somar
   * capitais: somar produziria um mapa otimista, que é a pior espécie de erro
   * num documento de proteção.
   */
  it("franquia entra na conta — capital contratado não é dinheiro no bolso", () => {
    const rows = buildRiskMap(
      [cenario("E", 10000)],
      [
        cobertura({
          policyKind: "AUTOMOVEL",
          capitalInsured: new Decimal(50000),
          deductible: new Decimal(3000),
        }),
      ],
    );
    expect(rows[0].cobertoPorSeguro.toFixed(2)).toBe("7000.00");
    expect(rows[0].residual.toFixed(2)).toBe("3000.00");
    expect(rows[0].tratamento).toBe("COMPLEMENTAR");
  });

  it("risco não transferível vira reter, mesmo sem nenhuma apólice", () => {
    const rows = buildRiskMap([cenario("A", 5000)], [cobertura()]);
    expect(rows[0].transferivel).toBe(false);
    expect(rows[0].tratamento).toBe("RETER");
    expect(rows[0].justificativa).toContain("liquidez própria");
  });

  it("cenário sem necessidade não pede ação", () => {
    const rows = buildRiskMap([cenario("B", 0)], []);
    expect(rows[0].tratamento).toBe("COBERTO");
  });

  it("toda linha explica o porquê, nunca só o rótulo", () => {
    const rows = buildRiskMap([cenario("A", 100), cenario("B", 100)], []);
    for (const r of rows) expect(r.justificativa.length).toBeGreaterThan(10);
  });

  it("nomeia as apólices consideradas, para a conta ser auditável", () => {
    const rows = buildRiskMap(
      [cenario("B", 5000)],
      [cobertura({ policyName: "Proteção Renda Y" }), cobertura({ policyName: "Proteção Renda Y" })],
    );
    // Sem repetir a mesma apólice por ter duas coberturas.
    expect(rows[0].apolicesAplicaveis).toEqual(["Proteção Renda Y"]);
  });
});

describe("summarizeRiskMap", () => {
  it("separa o que dá para transferir do que só resta reter", () => {
    const rows = buildRiskMap([cenario("A", 4000), cenario("B", 6000)], []);
    const s = summarizeRiskMap(rows);

    expect(s.totalNecessario.toFixed(2)).toBe("10000.00");
    expect(s.totalResidual.toFixed(2)).toBe("10000.00");
    expect(s.aTransferir.map((r) => r.scenarioId)).toEqual(["B"]);
    expect(s.aReter.map((r) => r.scenarioId)).toEqual(["A"]);
  });

  it("mapa vazio não quebra", () => {
    const s = summarizeRiskMap([]);
    expect(s.totalNecessario.toFixed(2)).toBe("0.00");
    expect(s.aTransferir).toEqual([]);
  });
});
