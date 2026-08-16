import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  computeFunctionMap,
  unclassifiedFindings,
  FUNCOES,
  type PatrimonyItem,
} from "@/lib/method/patrimony-function";

let counter = 0;
function item(overrides: Partial<PatrimonyItem> = {}): PatrimonyItem {
  counter += 1;
  return {
    id: `item-${counter}`,
    kind: "BEM",
    name: `[teste] item ${counter}`,
    value: new Decimal(1000),
    funcao: null,
    ...overrides,
  };
}

describe("computeFunctionMap", () => {
  it("devolve as 7 funções sempre, mesmo sem nenhum item", () => {
    const map = computeFunctionMap([]);
    expect(map.slices).toHaveLength(7);
    expect(map.slices.map((s) => s.funcao)).toEqual(FUNCOES);
    expect(map.total.toString()).toBe("0");
  });

  it("não divide por zero quando o patrimônio total é zero", () => {
    const map = computeFunctionMap([item({ value: new Decimal(0) })]);
    expect(map.slices.every((s) => s.percent === 0)).toBe(true);
    expect(map.semFuncaoPercent).toBe(0);
  });

  it("soma os itens de cada função e calcula o percentual do total", () => {
    const map = computeFunctionMap([
      item({ funcao: "USO", value: new Decimal(600) }),
      item({ funcao: "USO", value: new Decimal(200) }),
      item({ funcao: "PROTECAO", value: new Decimal(200) }),
    ]);

    const uso = map.slices.find((s) => s.funcao === "USO")!;
    expect(uso.total.toString()).toBe("800");
    expect(uso.percent).toBe(80);
    expect(uso.itemCount).toBe(2);

    const protecao = map.slices.find((s) => s.funcao === "PROTECAO")!;
    expect(protecao.percent).toBe(20);
    expect(map.total.toString()).toBe("1000");
  });

  it("mantém 'sem função' separado, nunca diluído nas 7 fatias", () => {
    const map = computeFunctionMap([
      item({ funcao: "CRESCIMENTO", value: new Decimal(700) }),
      item({ funcao: null, value: new Decimal(300) }),
    ]);

    expect(map.semFuncao.toString()).toBe("300");
    expect(map.semFuncaoPercent).toBe(30);
    expect(map.semFuncaoCount).toBe(1);
    const somaDasFatias = map.slices.reduce((sum, s) => sum.plus(s.total), new Decimal(0));
    expect(somaDasFatias.toString()).toBe("700");
  });

  it("função sem nenhum item aparece zerada, não some do mapa", () => {
    const map = computeFunctionMap([item({ funcao: "SUCESSAO", value: new Decimal(100) })]);
    const longevidade = map.slices.find((s) => s.funcao === "LONGEVIDADE")!;
    expect(longevidade.total.toString()).toBe("0");
    expect(longevidade.itemCount).toBe(0);
  });

  it("soma valores negativos como estão (bem depreciado continua no mapa)", () => {
    const map = computeFunctionMap([
      item({ funcao: "USO", value: new Decimal(1000) }),
      item({ funcao: "USO", value: new Decimal(-400) }),
    ]);
    expect(map.slices.find((s) => s.funcao === "USO")!.total.toString()).toBe("600");
  });

  it("agrega os três tipos de item (bem, investimento e carteira) no mesmo mapa", () => {
    const map = computeFunctionMap([
      item({ kind: "BEM", funcao: "USO", value: new Decimal(100) }),
      item({ kind: "INVESTIMENTO", funcao: "USO", value: new Decimal(100) }),
      item({ kind: "CARTEIRA", funcao: "USO", value: new Decimal(100) }),
    ]);
    expect(map.slices.find((s) => s.funcao === "USO")!.itemCount).toBe(3);
    expect(map.total.toString()).toBe("300");
  });
});

describe("unclassifiedFindings", () => {
  it("lista só o que não tem função, do maior valor para o menor", () => {
    const findings = unclassifiedFindings([
      item({ funcao: null, value: new Decimal(100), name: "menor" }),
      item({ funcao: "USO", value: new Decimal(9999), name: "classificado" }),
      item({ funcao: null, value: new Decimal(500), name: "maior" }),
    ]);

    expect(findings.map((f) => f.name)).toEqual(["maior", "menor"]);
  });

  it("ignora item zerado — não é achado acionável", () => {
    const findings = unclassifiedFindings([item({ funcao: null, value: new Decimal(0) })]);
    expect(findings).toHaveLength(0);
  });

  it("ignora item de valor negativo", () => {
    const findings = unclassifiedFindings([item({ funcao: null, value: new Decimal(-50) })]);
    expect(findings).toHaveLength(0);
  });

  it("devolve lista vazia quando está tudo classificado", () => {
    const findings = unclassifiedFindings([
      item({ funcao: "PROTECAO" }),
      item({ funcao: "LIQUIDEZ_OPERACIONAL" }),
    ]);
    expect(findings).toHaveLength(0);
  });
});
