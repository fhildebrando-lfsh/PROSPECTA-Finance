import { describe, expect, it } from "vitest";
import {
  FAIXA_ORDER,
  FAIXA_STEPS,
  evolucaoFaixa,
  faixaDoSnapshot,
  faixaIndex,
  faixaProgressPct,
} from "@/lib/method/psf-progress";

describe("escala das faixas", () => {
  it("tem os cinco degraus do §8.3, do pior para o melhor", () => {
    expect(FAIXA_ORDER).toEqual(["critico", "fragil", "em_construcao", "saudavel", "consolidado"]);
    expect(FAIXA_STEPS).toBe(5);
  });

  it("faixaIndex devolve a posição e null para não avaliado", () => {
    expect(faixaIndex("critico")).toBe(0);
    expect(faixaIndex("consolidado")).toBe(4);
    expect(faixaIndex(null)).toBeNull();
  });
});

describe("faixaProgressPct", () => {
  /**
   * Estar em "crítico" é estar na escala. Barra vazia leria como "sem
   * avaliação", que é outro estado e tem representação própria na tela.
   */
  it("o primeiro degrau já preenche um quinto", () => {
    expect(faixaProgressPct("critico")).toBe(20);
  });

  it("o último degrau preenche tudo", () => {
    expect(faixaProgressPct("consolidado")).toBe(100);
  });

  it("cresce monotonicamente na ordem da escala", () => {
    const pcts = FAIXA_ORDER.map(faixaProgressPct);
    for (let i = 1; i < pcts.length; i++) expect(pcts[i]).toBeGreaterThan(pcts[i - 1]);
  });

  it("não avaliado é zero — e a tela distingue isso de crítico pelo rótulo", () => {
    expect(faixaProgressPct(null)).toBe(0);
  });
});

describe("evolucaoFaixa", () => {
  it("subir de degrau é subida, com a distância", () => {
    expect(evolucaoFaixa("fragil", "saudavel")).toEqual({ mudanca: "subiu", degraus: 2 });
  });

  it("descer de degrau é queda", () => {
    expect(evolucaoFaixa("saudavel", "em_construcao")).toEqual({ mudanca: "desceu", degraus: 1 });
  });

  it("mesma faixa não é mudança", () => {
    expect(evolucaoFaixa("saudavel", "saudavel")).toEqual({ mudanca: "igual", degraus: 0 });
  });

  it("sem foto anterior não há comparação", () => {
    expect(evolucaoFaixa(undefined, "saudavel")).toBeNull();
  });

  /**
   * O ponto que importa: "não avaliado" não é o degrau zero. Tratá-lo assim
   * inventaria uma queda que nunca houve — o indicador não piorou, ele deixou
   * de (ou passou a) ter dado.
   */
  it("não avaliado de um dos lados não vira queda nem subida", () => {
    expect(evolucaoFaixa(null, "critico")).toBeNull();
    expect(evolucaoFaixa("consolidado", null)).toBeNull();
  });
});

describe("faixaDoSnapshot", () => {
  it("lê a faixa do indicador", () => {
    const json = { organizacao: { faixa: "saudavel", valor: 80 } };
    expect(faixaDoSnapshot(json, "organizacao")).toBe("saudavel");
  });

  it("indicador ausente devolve null em vez de quebrar", () => {
    // Foto antiga, gravada antes de o indicador existir.
    expect(faixaDoSnapshot({ organizacao: { faixa: "saudavel", valor: 80 } }, "protecao")).toBeNull();
  });

  it("aguenta JSON de formato inesperado", () => {
    expect(faixaDoSnapshot(null, "organizacao")).toBeNull();
    expect(faixaDoSnapshot("texto solto", "organizacao")).toBeNull();
    expect(faixaDoSnapshot({ organizacao: "errado" }, "organizacao")).toBeNull();
    expect(faixaDoSnapshot({ organizacao: { faixa: "inventada" } }, "organizacao")).toBeNull();
  });

  it("faixa nula gravada continua nula", () => {
    expect(faixaDoSnapshot({ liquidez: { faixa: null, valor: null } }, "liquidez")).toBeNull();
  });
});
