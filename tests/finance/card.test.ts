import { describe, expect, it } from "vitest";
import { cardCoverage, cardStatementTotal, cardStatementWindow } from "@/lib/finance/card";
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
