import { describe, expect, it } from "vitest";
import {
  annualCardSpend,
  cardCoverage,
  cardStatementTotal,
  cardStatementWindow,
  currentStatementWindow,
  statementWindowForDate,
} from "@/lib/finance/card";
import { d, makeEntry } from "./helpers";

describe("cardStatementWindow (§11.4)", () => {
  it("janela vai do dia seguinte ao fechamento anterior até o fechamento deste mês", () => {
    const window = cardStatementWindow({ closingDay: 10, dueDay: 5 }, 2026, 5); // fecha 10/jun/2026
    expect(window.windowStart.toISOString().slice(0, 10)).toBe("2026-05-11");
    expect(window.windowEnd.toISOString().slice(0, 10)).toBe("2026-06-10");
  });

  it("vencimento é no dueDay do mês seguinte ao fechamento", () => {
    const window = cardStatementWindow({ closingDay: 10, dueDay: 5 }, 2026, 5);
    expect(window.dueDate.toISOString().slice(0, 10)).toBe("2026-07-05");
  });

  it("funciona na virada de ano", () => {
    const window = cardStatementWindow({ closingDay: 10, dueDay: 5 }, 2026, 0); // fecha 10/jan/2026
    expect(window.windowStart.toISOString().slice(0, 10)).toBe("2025-12-11");
    expect(window.dueDate.toISOString().slice(0, 10)).toBe("2026-02-05");
  });
});

describe("currentStatementWindow (§12 — Vence default de lançamento em cartão)", () => {
  it("antes do fechamento -> fatura vigente fecha este mês", () => {
    const today = new Date(Date.UTC(2026, 5, 5)); // 5/jun, fecha dia 10
    const window = currentStatementWindow({ closingDay: 10, dueDay: 5 }, today);
    expect(window.windowEnd.toISOString().slice(0, 10)).toBe("2026-06-10");
    expect(window.dueDate.toISOString().slice(0, 10)).toBe("2026-07-05");
  });

  it("depois do fechamento -> fatura vigente é a do mês seguinte", () => {
    const today = new Date(Date.UTC(2026, 5, 15)); // 15/jun, já passou do fechamento (dia 10)
    const window = currentStatementWindow({ closingDay: 10, dueDay: 5 }, today);
    expect(window.windowEnd.toISOString().slice(0, 10)).toBe("2026-07-10");
    expect(window.dueDate.toISOString().slice(0, 10)).toBe("2026-08-05");
  });

  it("no dia exato do fechamento, a fatura que fecha hoje ainda é a vigente", () => {
    const today = new Date(Date.UTC(2026, 5, 10));
    const window = currentStatementWindow({ closingDay: 10, dueDay: 5 }, today);
    expect(window.windowEnd.toISOString().slice(0, 10)).toBe("2026-06-10");
  });

  it("funciona na virada de ano", () => {
    const today = new Date(Date.UTC(2026, 11, 15)); // 15/dez, fecha dia 10 -> vigente fecha em jan/2027
    const window = currentStatementWindow({ closingDay: 10, dueDay: 5 }, today);
    expect(window.windowEnd.toISOString().slice(0, 10)).toBe("2027-01-10");
  });
});

describe("statementWindowForDate (§18 — importação de OFX de cartão)", () => {
  it("mesma fórmula de currentStatementWindow, mas para qualquer data de referência", () => {
    const purchaseDate = new Date(Date.UTC(2026, 4, 20)); // 20/mai, antes do fechamento (dia 10 de junho)
    const window = statementWindowForDate({ closingDay: 10, dueDay: 5 }, purchaseDate);
    expect(window.windowEnd.toISOString().slice(0, 10)).toBe("2026-06-10");
    expect(window.dueDate.toISOString().slice(0, 10)).toBe("2026-07-05");
  });

  it("compra depois do fechamento do mês cai na fatura seguinte", () => {
    const purchaseDate = new Date(Date.UTC(2026, 5, 15)); // 15/jun, já passou do fechamento (dia 10)
    const window = statementWindowForDate({ closingDay: 10, dueDay: 5 }, purchaseDate);
    expect(window.windowEnd.toISOString().slice(0, 10)).toBe("2026-07-10");
    expect(window.dueDate.toISOString().slice(0, 10)).toBe("2026-08-05");
  });

  it("currentStatementWindow(today) e statementWindowForDate(today) dão o mesmo resultado", () => {
    const today = new Date(Date.UTC(2026, 5, 5));
    const config = { closingDay: 10, dueDay: 5 };
    expect(currentStatementWindow(config, today)).toEqual(statementWindowForDate(config, today));
  });
});

describe("cardStatementTotal (§11.4)", () => {
  it("soma por transaction_date (Compra), dentro da janela da fatura", () => {
    const window = cardStatementWindow({ closingDay: 10, dueDay: 5 }, 2026, 5);
    const entries = [
      makeEntry({ walletId: "cartao-1", amount: d(-100), transactionDate: new Date(Date.UTC(2026, 4, 15)) }), // dentro
      makeEntry({ walletId: "cartao-1", amount: d(-200), transactionDate: new Date(Date.UTC(2026, 4, 5)) }), // fora (antes)
      makeEntry({ walletId: "cartao-1", amount: d(-300), transactionDate: new Date(Date.UTC(2026, 5, 11)) }), // fora (depois)
      makeEntry({ walletId: "outro-cartao", amount: d(-999), transactionDate: new Date(Date.UTC(2026, 4, 15)) }),
    ];

    expect(cardStatementTotal(entries, "cartao-1", window).toNumber()).toBe(-100);
  });
});

describe("annualCardSpend (Cartões de Crédito — Análise de Benefícios)", () => {
  it("soma o valor absoluto das despesas dos últimos 12 meses, ignorando outras carteiras/naturezas", () => {
    const referenceDate = new Date(Date.UTC(2026, 5, 30)); // 30/jun/2026
    const entries = [
      makeEntry({ walletId: "cartao-1", amount: d(-100), transactionDate: new Date(Date.UTC(2026, 3, 1)) }), // dentro
      makeEntry({ walletId: "cartao-1", amount: d(-200), transactionDate: new Date(Date.UTC(2025, 4, 1)) }), // fora (>12 meses)
      makeEntry({
        walletId: "cartao-1",
        nature: "RECEITA",
        amount: d(50),
        transactionDate: new Date(Date.UTC(2026, 3, 1)),
      }), // fora (não é despesa — ex.: estorno)
      makeEntry({ walletId: "outro-cartao", amount: d(-999), transactionDate: new Date(Date.UTC(2026, 3, 1)) }),
    ];

    expect(annualCardSpend(entries, "cartao-1", referenceDate).toNumber()).toBe(100);
  });

  it("retorna zero sem nenhuma despesa no período", () => {
    const referenceDate = new Date(Date.UTC(2026, 5, 30));
    expect(annualCardSpend([], "cartao-1", referenceDate).toNumber()).toBe(0);
  });
});

describe("cardCoverage (§11.5)", () => {
  it("saldo = caixinha vinculada − dívida A_PAGAR do cartão", () => {
    const entries = [
      makeEntry({ walletId: "cartao-1", status: "A_PAGAR", amount: d(-3315.48) }),
      makeEntry({ walletId: "cartao-1", status: "PAGO", amount: d(-500) }), // já pago, não conta na dívida
    ];

    const coverage = cardCoverage(d(78.15), entries, "cartao-1");
    expect(coverage.divida.toNumber()).toBeCloseTo(3315.48, 2);
    expect(coverage.saldo.toNumber()).toBeCloseTo(78.15 - 3315.48, 2);
    expect(coverage.saldo.isNegative()).toBe(true);
  });
});
