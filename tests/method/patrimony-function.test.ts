import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  buildPatrimonyItems,
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

  it("patrimônio total negativo não inverte o sinal dos percentuais", () => {
    // Conta no cheque especial (-2000) + poupança sem função (+500) = total -1500.
    // Antes da correção isto devolvia 133,3% para a fatia negativa e -33,3% para a
    // positiva, ambos impressos crus na tela.
    const map = computeFunctionMap([
      item({ funcao: "LIQUIDEZ_OPERACIONAL", value: new Decimal(-2000) }),
      item({ funcao: null, value: new Decimal(500) }),
    ]);

    expect(map.total.toString()).toBe("-1500");
    expect(map.slices.every((s) => s.percent === 0)).toBe(true);
    expect(map.semFuncaoPercent).toBe(0);
    // Os valores em si continuam verdadeiros — só o percentual é que não tem base.
    expect(map.slices.find((s) => s.funcao === "LIQUIDEZ_OPERACIONAL")!.total.toString()).toBe("-2000");
    expect(map.semFuncao.toString()).toBe("500");
  });

  it("total zero por cancelamento entre itens não nulos não quebra o cálculo", () => {
    const map = computeFunctionMap([
      item({ funcao: "USO", value: new Decimal(2000) }),
      item({ funcao: "LIQUIDEZ_OPERACIONAL", value: new Decimal(-2000) }),
    ]);

    expect(map.total.toString()).toBe("0");
    expect(map.slices.every((s) => s.percent === 0)).toBe(true);
    // A fatia guarda R$ 2.000 de verdade, mesmo exibindo 0% — o valor é a informação
    // confiável aqui, o percentual não tem denominador válido.
    expect(map.slices.find((s) => s.funcao === "USO")!.total.toString()).toBe("2000");
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

describe("buildPatrimonyItems — desconto de dupla contagem", () => {
  const semFuncao = { funcao: null };

  it("desconta do saldo da carteira a posição que ela abriga", () => {
    // Transferiu 10k pra corretora (perna PAGO, entra no saldo) e comprou 10k
    // de CDB (AQUISICAO, não debita o caixa). Sem desconto seriam 20k.
    const items = buildPatrimonyItems({
      assets: [],
      investments: [{ id: "cdb", name: "CDB", walletId: "xp", value: new Decimal(10000), ...semFuncao }],
      wallets: [{ id: "xp", name: "XP", balance: new Decimal(10000), ...semFuncao }],
    });

    expect(items.find((i) => i.id === "xp")!.value.toString()).toBe("0");
    expect(items.find((i) => i.id === "cdb")!.value.toString()).toBe("10000");
    expect(computeFunctionMap(items).total.toString()).toBe("10000");
  });

  it("preserva o caixa não alocado quando se transferiu mais do que se investiu", () => {
    const items = buildPatrimonyItems({
      assets: [],
      investments: [{ id: "cdb", name: "CDB", walletId: "xp", value: new Decimal(10000), ...semFuncao }],
      wallets: [{ id: "xp", name: "XP", balance: new Decimal(15000), ...semFuncao }],
    });

    expect(items.find((i) => i.id === "xp")!.value.toString()).toBe("5000");
    expect(computeFunctionMap(items).total.toString()).toBe("15000");
  });

  it("soma várias posições da mesma carteira antes de descontar", () => {
    const items = buildPatrimonyItems({
      assets: [],
      investments: [
        { id: "a", name: "CDB", walletId: "xp", value: new Decimal(6000), ...semFuncao },
        { id: "b", name: "Tesouro", walletId: "xp", value: new Decimal(4000), ...semFuncao },
      ],
      wallets: [{ id: "xp", name: "XP", balance: new Decimal(10000), ...semFuncao }],
    });

    expect(items.find((i) => i.id === "xp")!.value.toString()).toBe("0");
  });

  it("posição cadastrada sem transferência não vira saldo negativo fantasma", () => {
    const items = buildPatrimonyItems({
      assets: [],
      investments: [{ id: "cdb", name: "CDB", walletId: "xp", value: new Decimal(10000), ...semFuncao }],
      wallets: [{ id: "xp", name: "XP", balance: new Decimal(0), ...semFuncao }],
    });

    expect(items.find((i) => i.id === "xp")!.value.toString()).toBe("0");
    expect(computeFunctionMap(items).total.toString()).toBe("10000");
  });

  it("carteira sem nenhuma posição mantém o saldo intacto, inclusive negativo", () => {
    const items = buildPatrimonyItems({
      assets: [],
      investments: [],
      wallets: [{ id: "cc", name: "Conta corrente", balance: new Decimal(-2000), ...semFuncao }],
    });

    // O piso em zero vale só para carteira que abriga posição — cheque especial
    // de uma conta comum é dívida real e continua aparecendo como tal.
    expect(items.find((i) => i.id === "cc")!.value.toString()).toBe("-2000");
  });

  it("preserva a função já classificada de cada origem", () => {
    const items = buildPatrimonyItems({
      assets: [{ id: "carro", name: "Carro", value: new Decimal(50000), funcao: "USO" }],
      investments: [{ id: "cdb", name: "CDB", walletId: "xp", value: new Decimal(1000), funcao: "PROTECAO" }],
      wallets: [{ id: "xp", name: "XP", balance: new Decimal(1000), funcao: "LIQUIDEZ_OPERACIONAL" }],
    });

    expect(items.find((i) => i.id === "carro")!.funcao).toBe("USO");
    expect(items.find((i) => i.id === "cdb")!.funcao).toBe("PROTECAO");
    expect(items.find((i) => i.id === "xp")!.funcao).toBe("LIQUIDEZ_OPERACIONAL");
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
