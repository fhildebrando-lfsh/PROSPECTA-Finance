import { describe, expect, it } from "vitest";
import { assetCurrentValue, patrimonyEvolution, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { d } from "./helpers";

function makeValuation(overrides: Partial<AssetValuationEntry> = {}): AssetValuationEntry {
  return {
    id: `val-${Math.random()}`,
    assetId: "asset-1",
    amount: d(0),
    status: "AQUISICAO",
    ...overrides,
  };
}

describe("assetCurrentValue (Fase 3, §7.4 — Patrimônio)", () => {
  it("soma aquisição + valorizações (positivas) e desvalorizações (negativas)", () => {
    const entries = [
      makeValuation({ status: "AQUISICAO", amount: d(50000) }),
      makeValuation({ status: "ATUALIZACAO", amount: d(3000) }), // valorização
      makeValuation({ status: "ATUALIZACAO", amount: d(-1000) }), // desvalorização
    ];

    expect(assetCurrentValue(entries).toNumber()).toBe(52000);
  });

  it("retorna zero para lista vazia (bem sem nenhum lançamento ainda)", () => {
    expect(assetCurrentValue([]).toNumber()).toBe(0);
  });

  it("um único lançamento de aquisição já define o valor inicial", () => {
    const entries = [makeValuation({ status: "AQUISICAO", amount: d(25000) })];
    expect(assetCurrentValue(entries).toNumber()).toBe(25000);
  });
});

describe("patrimonyEvolution", () => {
  it("ordena por data e acumula, independente da ordem de entrada", () => {
    const entries = [
      { ...makeValuation({ amount: d(1000) }), date: new Date(Date.UTC(2026, 2, 1)) },
      { ...makeValuation({ amount: d(50000) }), date: new Date(Date.UTC(2026, 0, 1)) },
      { ...makeValuation({ amount: d(-500) }), date: new Date(Date.UTC(2026, 1, 1)) },
    ];

    const points = patrimonyEvolution(entries);

    expect(points).toHaveLength(3);
    expect(points[0].date.getUTCMonth()).toBe(0);
    expect(points[0].cumulative.toNumber()).toBe(50000);
    expect(points[1].date.getUTCMonth()).toBe(1);
    expect(points[1].cumulative.toNumber()).toBe(49500);
    expect(points[2].date.getUTCMonth()).toBe(2);
    expect(points[2].cumulative.toNumber()).toBe(50500);
  });

  it("retorna lista vazia sem nenhum lançamento", () => {
    expect(patrimonyEvolution([])).toEqual([]);
  });
});
