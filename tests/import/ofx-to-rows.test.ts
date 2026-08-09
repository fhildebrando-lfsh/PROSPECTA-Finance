import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import { ofxTransactionsToRows, type OfxRowContext } from "@/lib/import/ofx-to-rows";
import type { OfxTransaction } from "@/lib/import/parse-ofx";

function transaction(overrides: Partial<OfxTransaction> = {}): OfxTransaction {
  return {
    fitId: "1",
    postedDate: new Date(Date.UTC(2026, 6, 5)),
    amount: new Decimal(-45.9),
    description: "MERCADO LIVRE",
    ...overrides,
  };
}

function context(overrides: Partial<OfxRowContext> = {}): OfxRowContext {
  return {
    walletName: "Conta Corrente",
    cardConfig: null,
    responsibleName: "Fulano",
    categorySuggestions: new Map(),
    fallbackCategoryNameByNature: { DESPESA: "Outras despesas", RECEITA: "Outras receitas" },
    today: new Date(Date.UTC(2026, 7, 8)),
    ...overrides,
  };
}

describe("ofxTransactionsToRows", () => {
  it("natureza pelo sinal do valor: negativo = DESPESA, positivo = RECEITA", () => {
    const rows = ofxTransactionsToRows(
      [transaction({ amount: new Decimal(-10) }), transaction({ amount: new Decimal(10) })],
      context(),
    );
    expect(rows[0].Tipo).toBe("DESPESA");
    expect(rows[1].Tipo).toBe("RECEITA");
  });

  it("usa a categoria sugerida por histórico quando existe, sem marcar revisão", () => {
    const rows = ofxTransactionsToRows(
      [transaction()],
      context({
        categorySuggestions: new Map([
          ["mercado livre", { categoryId: "c1", categoryName: "Compras Online", subcategoryId: null }],
        ]),
      }),
    );
    expect(rows[0].Categoria).toBe("Compras Online");
    expect(rows[0].__autoReviewReason).toBeUndefined();
  });

  it("cai na categoria padrão e marca __autoReviewReason quando não há histórico", () => {
    const rows = ofxTransactionsToRows([transaction()], context());
    expect(rows[0].Categoria).toBe("Outras despesas");
    expect(rows[0].__autoReviewReason).toContain("não havia histórico");
  });

  it("Recorrência sempre '1' (parcela avulsa, não conta como parcelamento)", () => {
    const rows = ofxTransactionsToRows([transaction()], context());
    expect(rows[0].Recorrência).toBe("1");
  });

  it("carteira comum: Compra = Vence = data postada", () => {
    const rows = ofxTransactionsToRows([transaction({ postedDate: new Date(Date.UTC(2026, 6, 5)) })], context());
    expect(rows[0].Compra).toBe("05/07/2026");
    expect(rows[0].Vence).toBe("05/07/2026");
  });

  it("carteira de cartão de crédito: Vence é o vencimento da fatura que contém a compra", () => {
    const rows = ofxTransactionsToRows(
      [transaction({ postedDate: new Date(Date.UTC(2026, 6, 5)) })], // compra 5/jul, fecha dia 10
      context({ cardConfig: { closingDay: 10, dueDay: 5 } }),
    );
    expect(rows[0].Compra).toBe("05/07/2026");
    expect(rows[0].Vence).toBe("05/08/2026"); // fatura fecha 10/jul, vence 5/ago
  });

  it("situação: vencimento no passado ou hoje vira liquidado (Pago/Recebido)", () => {
    const rows = ofxTransactionsToRows(
      [
        transaction({ amount: new Decimal(-1), postedDate: new Date(Date.UTC(2026, 7, 8)) }), // = today
        transaction({ amount: new Decimal(1), postedDate: new Date(Date.UTC(2026, 7, 1)) }), // antes de today
      ],
      context({ today: new Date(Date.UTC(2026, 7, 8)) }),
    );
    expect(rows[0].Situação).toBe("Pago");
    expect(rows[1].Situação).toBe("Recebido");
  });

  it("situação: vencimento no futuro vira A pagar/A receber", () => {
    const rows = ofxTransactionsToRows(
      [
        transaction({ amount: new Decimal(-1), postedDate: new Date(Date.UTC(2026, 7, 20)) }),
        transaction({ amount: new Decimal(1), postedDate: new Date(Date.UTC(2026, 7, 20)) }),
      ],
      context({ today: new Date(Date.UTC(2026, 7, 8)) }),
    );
    expect(rows[0].Situação).toBe("A pagar");
    expect(rows[1].Situação).toBe("A receber");
  });

  it("valor sintetizado usa vírgula decimal (formato esperado por parseBrlAmount)", () => {
    const rows = ofxTransactionsToRows([transaction({ amount: new Decimal(-1234.5) })], context());
    expect(rows[0].Valor).toBe("-1234,50");
  });
});
