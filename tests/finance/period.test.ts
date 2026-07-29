import { describe, expect, it } from "vitest";
import { periodTotals } from "@/lib/finance/period";
import { d, makeEntry } from "./helpers";

const junho2026 = { start: new Date(Date.UTC(2026, 5, 1)), end: new Date(Date.UTC(2026, 5, 30)) };

describe("periodTotals (§11.3)", () => {
  it("soma receita, despesa e investimento do período e calcula o balanço", () => {
    const entries = [
      makeEntry({ nature: "RECEITA", amount: d(5000), dueDate: new Date(Date.UTC(2026, 5, 5)) }),
      makeEntry({ nature: "DESPESA", amount: d(-2000), dueDate: new Date(Date.UTC(2026, 5, 10)) }),
      makeEntry({ nature: "INVESTIMENTO", amount: d(-500), dueDate: new Date(Date.UTC(2026, 5, 15)) }),
    ];

    const totals = periodTotals(entries, junho2026);
    expect(totals.receita.toNumber()).toBe(5000);
    expect(totals.despesa.toNumber()).toBe(-2000);
    expect(totals.investimento.toNumber()).toBe(-500);
    expect(totals.balanco.toNumber()).toBe(2500);
  });

  it("nature = OUTRO (transferências) fica fora por construção", () => {
    const entries = [makeEntry({ nature: "OUTRO", amount: d(1000), dueDate: new Date(Date.UTC(2026, 5, 5)) })];
    const totals = periodTotals(entries, junho2026);
    expect(totals.balanco.toNumber()).toBe(0);
  });

  it("inclui lançamentos não liquidados (A_PAGAR/A_RECEBER/ESTIMATIVA) — fiel à fórmula da planilha", () => {
    const entries = [
      makeEntry({ nature: "DESPESA", status: "A_PAGAR", amount: d(-300), dueDate: new Date(Date.UTC(2026, 5, 20)) }),
      makeEntry({
        nature: "RECEITA",
        status: "ESTIMATIVA",
        amount: d(1000),
        dueDate: new Date(Date.UTC(2026, 5, 25)),
      }),
    ];
    const totals = periodTotals(entries, junho2026);
    expect(totals.despesa.toNumber()).toBe(-300);
    expect(totals.receita.toNumber()).toBe(1000);
  });

  it("exclui lançamentos fora do período", () => {
    const entries = [
      makeEntry({ nature: "DESPESA", amount: d(-100), dueDate: new Date(Date.UTC(2026, 4, 30)) }),
      makeEntry({ nature: "DESPESA", amount: d(-200), dueDate: new Date(Date.UTC(2026, 6, 1)) }),
    ];
    const totals = periodTotals(entries, junho2026);
    expect(totals.despesa.toNumber()).toBe(0);
  });

  describe("regime caixa × competência (§10 R2)", () => {
    const entry = makeEntry({
      nature: "DESPESA",
      amount: d(-800),
      transactionDate: new Date(Date.UTC(2026, 4, 28)), // compra em maio (fatura de cartão)
      dueDate: new Date(Date.UTC(2026, 5, 5)), // vence em junho
    });

    it("regime caixa (default) usa due_date", () => {
      expect(periodTotals([entry], junho2026, "caixa").despesa.toNumber()).toBe(-800);
      const maio2026 = { start: new Date(Date.UTC(2026, 4, 1)), end: new Date(Date.UTC(2026, 4, 31)) };
      expect(periodTotals([entry], maio2026, "caixa").despesa.toNumber()).toBe(0);
    });

    it("regime competência usa transaction_date", () => {
      const maio2026 = { start: new Date(Date.UTC(2026, 4, 1)), end: new Date(Date.UTC(2026, 4, 31)) };
      expect(periodTotals([entry], maio2026, "competencia").despesa.toNumber()).toBe(-800);
      expect(periodTotals([entry], junho2026, "competencia").despesa.toNumber()).toBe(0);
    });
  });
});
