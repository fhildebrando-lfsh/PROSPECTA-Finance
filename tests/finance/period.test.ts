import { describe, expect, it } from "vitest";
import { monthlySeries, periodTotals, projectedBalance } from "@/lib/finance/period";
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

describe("monthlySeries", () => {
  it("gera N meses consecutivos, cada um com seu periodTotals", () => {
    const entries = [
      makeEntry({ nature: "RECEITA", amount: d(1000), dueDate: new Date(Date.UTC(2026, 4, 10)) }), // maio
      makeEntry({ nature: "DESPESA", amount: d(-300), dueDate: new Date(Date.UTC(2026, 5, 10)) }), // junho
      makeEntry({ nature: "RECEITA", amount: d(2000), dueDate: new Date(Date.UTC(2026, 6, 10)) }), // julho
    ];

    const series = monthlySeries(entries, 2026, 4, 3); // maio, junho, julho

    expect(series).toHaveLength(3);
    expect(series[0].totals.receita.toNumber()).toBe(1000);
    expect(series[0].totals.despesa.toNumber()).toBe(0);
    expect(series[1].totals.despesa.toNumber()).toBe(-300);
    expect(series[2].totals.receita.toNumber()).toBe(2000);
    expect(series[0].period.start.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(series[2].period.end.toISOString().slice(0, 10)).toBe("2026-07-31");
  });

  it("aceita startMonthIndex0 negativo/estourado, igual monthRange", () => {
    // dezembro/2025, janeiro/2026 — atravessando virada de ano
    const entries = [makeEntry({ nature: "RECEITA", amount: d(500), dueDate: new Date(Date.UTC(2025, 11, 20)) })];
    const series = monthlySeries(entries, 2026, -1, 2); // mês -1 = dezembro/2025, mês 0 = janeiro/2026

    expect(series[0].period.start.getUTCFullYear()).toBe(2025);
    expect(series[0].period.start.getUTCMonth()).toBe(11);
    expect(series[0].totals.receita.toNumber()).toBe(500);
    expect(series[1].period.start.getUTCFullYear()).toBe(2026);
    expect(series[1].period.start.getUTCMonth()).toBe(0);
  });
});

describe("projectedBalance (§13 — Fluxo projetado)", () => {
  const wallets = [{ id: "conta-1", kindCode: "CONTA_BANCARIA" }];
  const fromDate = new Date(Date.UTC(2026, 5, 15)); // 15/jun/2026

  it("parte do saldo real de hoje e acumula os meses seguintes, sem contar o mês corrente duas vezes", () => {
    const entries = [
      // já liquidado antes de hoje — entra no saldo atual via dashboardBalanceBlocks
      makeEntry({ walletId: "conta-1", nature: "RECEITA", status: "PAGO", amount: d(1000), dueDate: new Date(Date.UTC(2026, 5, 10)) }),
      // ainda não liquidado, mas no mês corrente (depois de hoje) — não deve aparecer em `current` nem nos `points` (mês corrente é ignorado de propósito)
      makeEntry({ walletId: "conta-1", nature: "DESPESA", status: "A_PAGAR", amount: d(-9999), dueDate: new Date(Date.UTC(2026, 5, 20)) }),
      // julho — primeiro mês projetado
      makeEntry({ nature: "RECEITA", status: "A_RECEBER", amount: d(300), dueDate: new Date(Date.UTC(2026, 6, 5)) }),
      // agosto — segundo mês projetado
      makeEntry({ nature: "DESPESA", status: "A_PAGAR", amount: d(-100), dueDate: new Date(Date.UTC(2026, 7, 5)) }),
    ];

    const result = projectedBalance(entries, wallets, fromDate, 2);

    expect(result.current.toNumber()).toBe(1000);
    expect(result.points).toHaveLength(2);
    expect(result.points[0].period.start.getUTCMonth()).toBe(6); // julho
    expect(result.points[0].balance.toNumber()).toBe(1300); // 1000 + 300
    expect(result.points[1].period.start.getUTCMonth()).toBe(7); // agosto
    expect(result.points[1].balance.toNumber()).toBe(1200); // 1300 - 100
  });
});
