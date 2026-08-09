import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import { installmentKey, pdfTransactionsToRows, type PdfRowContext } from "@/lib/import/pdf-statement/pdf-to-rows";
import type { PdfStatementTransaction } from "@/lib/import/pdf-statement/types";

function transaction(overrides: Partial<PdfStatementTransaction> = {}): PdfStatementTransaction {
  return {
    postedDate: new Date(Date.UTC(2026, 6, 5)),
    amount: new Decimal(-45.9),
    description: "MAGALU",
    installmentNumber: null,
    installmentTotal: null,
    ...overrides,
  };
}

function context(overrides: Partial<PdfRowContext> = {}): PdfRowContext {
  return {
    walletName: "Nubank Ultravioleta",
    cardConfig: { closingDay: 10, dueDay: 5 }, // compra em 5/jul fecha dia 10/jul, vence 5/ago
    responsibleName: "Fulano",
    categorySuggestions: new Map(),
    fallbackCategoryNameByNature: { DESPESA: "Outras despesas", RECEITA: "Outras receitas" },
    today: new Date(Date.UTC(2026, 7, 8)),
    existingInstallmentKeys: new Set(),
    ...overrides,
  };
}

describe("pdfTransactionsToRows — compra à vista (sem parcelamento)", () => {
  it("Recorrência '1', Vence pela fatura que contém a compra", () => {
    const result = pdfTransactionsToRows([transaction()], context());
    expect(result.records).toHaveLength(1);
    expect(result.records[0].Recorrência).toBe("1");
    expect(result.records[0].Compra).toBe("05/07/2026");
    expect(result.records[0].Vence).toBe("05/08/2026");
    expect(result.skippedDuplicateInstallments).toBe(0);
  });
});

describe("pdfTransactionsToRows — primeira vez vendo uma série de parcelamento", () => {
  it("parcela 1/N gera as N parcelas de uma vez, mês a mês", () => {
    const result = pdfTransactionsToRows(
      [transaction({ amount: new Decimal(-100), installmentNumber: 1, installmentTotal: 3 })],
      context(),
    );

    expect(result.records).toHaveLength(3);
    expect(result.records.map((r) => r.Recorrência)).toEqual(["1/3", "2/3", "3/3"]);
    expect(result.records.map((r) => r.Vence)).toEqual(["05/08/2026", "05/09/2026", "05/10/2026"]);
    expect(result.records.every((r) => r.Valor === "-100,00")).toBe(true);
    expect(result.skippedDuplicateInstallments).toBe(0);
  });

  it("cada parcela gerada não vem marcada para revisão (não é um caso órfão)", () => {
    const result = pdfTransactionsToRows(
      [transaction({ installmentNumber: 1, installmentTotal: 2 })],
      context({ categorySuggestions: new Map([["magalu", { categoryId: "c1", categoryName: "Compras", subcategoryId: null }]]) }),
    );
    expect(result.records.every((r) => r.__autoReviewReason === undefined)).toBe(true);
  });
});

describe("pdfTransactionsToRows — deduplicação de parcela já lançada", () => {
  it("parcela que já existe (mesma carteira/total/número/vencimento) é descartada, não duplicada", () => {
    // parcela 2/3 dessa compra já foi lançada quando a série completa foi gerada no mês anterior
    const dueDate = new Date(Date.UTC(2026, 8, 5)); // vencimento da parcela 2/3 (05/set)
    const existingInstallmentKeys = new Set([installmentKey(2, 3, dueDate)]);

    const result = pdfTransactionsToRows(
      [transaction({ postedDate: new Date(Date.UTC(2026, 7, 5)), installmentNumber: 2, installmentTotal: 3 })],
      context({ existingInstallmentKeys }),
    );

    expect(result.records).toHaveLength(0);
    expect(result.skippedDuplicateInstallments).toBe(1);
  });

  it("deduplicação não usa o texto da descrição — só carteira/total/número/vencimento", () => {
    const dueDate = new Date(Date.UTC(2026, 8, 5));
    const existingInstallmentKeys = new Set([installmentKey(2, 3, dueDate)]);

    // descrição na fatura ("MAGALU 02/03") é diferente da que teria sido digitada
    // manualmente ("Notebook Dell") — a deduplicação deve funcionar mesmo assim.
    const result = pdfTransactionsToRows(
      [
        transaction({
          description: "MAGALU 02/03",
          postedDate: new Date(Date.UTC(2026, 7, 5)),
          installmentNumber: 2,
          installmentTotal: 3,
        }),
      ],
      context({ existingInstallmentKeys }),
    );

    expect(result.records).toHaveLength(0);
  });
});

describe("pdfTransactionsToRows — parcela órfã (2ª+ sem a 1ª conhecida)", () => {
  it("importa só a linha da fatura, sinalizada para revisão manual, sem tentar reconstruir o histórico", () => {
    const result = pdfTransactionsToRows(
      [transaction({ installmentNumber: 4, installmentTotal: 10 })],
      context(), // nenhuma parcela existente no sistema
    );

    expect(result.records).toHaveLength(1);
    expect(result.records[0].Recorrência).toBe("4/10");
    expect(result.records[0].__autoReviewReason).toContain("parcela anterior já lançada");
    expect(result.skippedDuplicateInstallments).toBe(0);
  });
});
