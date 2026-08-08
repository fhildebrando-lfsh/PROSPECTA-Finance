import { describe, expect, it } from "vitest";
import { categoryDistribution, categoryMonthlyBreakdown, topEntries } from "@/lib/finance/rankings";
import { d, makeEntry } from "./helpers";

const junho2026 = { start: new Date(Date.UTC(2026, 5, 1)), end: new Date(Date.UTC(2026, 5, 30)) };

describe("topEntries (§11.8)", () => {
  it("ordena por valor absoluto decrescente e limita ao top N", () => {
    const entries = [
      makeEntry({ nature: "DESPESA", amount: d(-50), dueDate: new Date(Date.UTC(2026, 5, 5)) }),
      makeEntry({ nature: "DESPESA", amount: d(-500), dueDate: new Date(Date.UTC(2026, 5, 6)) }),
      makeEntry({ nature: "DESPESA", amount: d(-200), dueDate: new Date(Date.UTC(2026, 5, 7)) }),
    ];

    const top2 = topEntries(entries, "DESPESA", junho2026, "caixa", 2);
    expect(top2.map((e) => e.amount.toNumber())).toEqual([-500, -200]);
  });

  it("filtra por natureza e por período", () => {
    const entries = [
      makeEntry({ nature: "RECEITA", amount: d(1000), dueDate: new Date(Date.UTC(2026, 5, 5)) }),
      makeEntry({ nature: "DESPESA", amount: d(-1000), dueDate: new Date(Date.UTC(2026, 5, 5)) }),
      makeEntry({ nature: "RECEITA", amount: d(2000), dueDate: new Date(Date.UTC(2026, 6, 5)) }), // fora do período
    ];

    const top = topEntries(entries, "RECEITA", junho2026);
    expect(top).toHaveLength(1);
    expect(top[0].amount.toNumber()).toBe(1000);
  });
});

describe("categoryDistribution (§11.8)", () => {
  it("agrupa despesas por categoria e calcula % do total", () => {
    const entries = [
      makeEntry({ nature: "DESPESA", categoryId: "alimentacao", amount: d(-300), dueDate: new Date(Date.UTC(2026, 5, 5)) }),
      makeEntry({ nature: "DESPESA", categoryId: "alimentacao", amount: d(-100), dueDate: new Date(Date.UTC(2026, 5, 6)) }),
      makeEntry({ nature: "DESPESA", categoryId: "transporte", amount: d(-100), dueDate: new Date(Date.UTC(2026, 5, 7)) }),
    ];

    const distribution = categoryDistribution(entries, junho2026);
    const byCategory = Object.fromEntries(distribution.map((r) => [r.categoryId, r]));

    expect(byCategory["alimentacao"].total.toNumber()).toBe(400);
    expect(byCategory["alimentacao"].percentage.toNumber()).toBe(80);
    expect(byCategory["transporte"].total.toNumber()).toBe(100);
    expect(byCategory["transporte"].percentage.toNumber()).toBe(20);
  });

  it("retorna lista vazia e não quebra quando não há despesas no período", () => {
    expect(categoryDistribution([], junho2026)).toEqual([]);
  });
});

describe("categoryMonthlyBreakdown (§13 — Balanço anual, descritivo por categoria)", () => {
  it("agrupa despesas por categoria com uma coluna por mês e o total anual, ordenado por total desc", () => {
    const entries = [
      makeEntry({ nature: "DESPESA", categoryId: "alimentacao", amount: d(-300), dueDate: new Date(Date.UTC(2026, 0, 5)) }), // jan
      makeEntry({ nature: "DESPESA", categoryId: "alimentacao", amount: d(-100), dueDate: new Date(Date.UTC(2026, 1, 5)) }), // fev
      makeEntry({ nature: "DESPESA", categoryId: "transporte", amount: d(-900), dueDate: new Date(Date.UTC(2026, 5, 5)) }), // jun
      makeEntry({ nature: "RECEITA", categoryId: "alimentacao", amount: d(999), dueDate: new Date(Date.UTC(2026, 0, 5)) }), // ignorado (não é DESPESA)
      makeEntry({ nature: "DESPESA", categoryId: "alimentacao", amount: d(-50), dueDate: new Date(Date.UTC(2025, 11, 20)) }), // fora do ano
    ];

    const rows = categoryMonthlyBreakdown(entries, 2026);

    expect(rows).toHaveLength(2);
    expect(rows[0].categoryId).toBe("transporte"); // maior total vem primeiro
    expect(rows[0].total.toNumber()).toBe(900);
    expect(rows[0].monthly[5].toNumber()).toBe(900);
    expect(rows[0].monthly[0].toNumber()).toBe(0);

    const alimentacao = rows.find((r) => r.categoryId === "alimentacao")!;
    expect(alimentacao.monthly[0].toNumber()).toBe(300);
    expect(alimentacao.monthly[1].toNumber()).toBe(100);
    expect(alimentacao.total.toNumber()).toBe(400);
  });

  it("retorna lista vazia quando não há despesas no ano", () => {
    expect(categoryMonthlyBreakdown([], 2026)).toEqual([]);
  });
});
