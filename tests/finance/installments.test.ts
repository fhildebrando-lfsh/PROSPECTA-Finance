import { describe, expect, it } from "vitest";
import { generateInstallments, generateRecurrenceOccurrences } from "@/lib/finance/installments";
import { d } from "./helpers";

describe("generateInstallments (§8.5)", () => {
  it("gera N parcelas com mesmo group_id e transaction_date, due_date avançando mês a mês", () => {
    const result = generateInstallments({
      totalInstallments: 3,
      firstDueDate: new Date(Date.UTC(2026, 0, 10)),
      transactionDate: new Date(Date.UTC(2026, 0, 3)),
      amount: d(-150),
      groupId: "group-1",
    });

    expect(result).toHaveLength(3);
    expect(result.map((r) => r.installmentNumber)).toEqual([1, 2, 3]);
    expect(result.every((r) => r.groupId === "group-1")).toBe(true);
    expect(result.every((r) => r.installmentTotal === 3)).toBe(true);
    expect(result.every((r) => r.transactionDate.toISOString() === new Date(Date.UTC(2026, 0, 3)).toISOString())).toBe(
      true,
    );
    expect(result.map((r) => r.dueDate.toISOString().slice(0, 10))).toEqual([
      "2026-01-10",
      "2026-02-10",
      "2026-03-10",
    ]);
  });

  it("lida com virada de mês em due_date perto do fim do mês (financiamento longo, tipo APTO FINANC.)", () => {
    const result = generateInstallments({
      totalInstallments: 3,
      firstDueDate: new Date(Date.UTC(2026, 0, 31)),
      transactionDate: new Date(Date.UTC(2026, 0, 31)),
      amount: d(-1200),
      groupId: "group-2",
    });

    // cada parcela recalcula a partir do due_date ORIGINAL (dia 31), não em
    // cadeia a partir da parcela anterior — por isso março volta a cair no
    // dia 31 (tem 31 dias) em vez de ficar preso em 28 por causa de fevereiro.
    expect(result.map((r) => r.dueDate.toISOString().slice(0, 10))).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });

  it("rejeita totalInstallments menor que 1", () => {
    expect(() =>
      generateInstallments({
        totalInstallments: 0,
        firstDueDate: new Date(),
        transactionDate: new Date(),
        amount: d(-100),
        groupId: "group-3",
      }),
    ).toThrow();
  });
});

describe("generateRecurrenceOccurrences (§8.5 — materializa 24 meses à frente)", () => {
  it("Mensal (intervalMonths=1) gera 25 ocorrências cobrindo 24 meses", () => {
    const result = generateRecurrenceOccurrences({
      firstDueDate: new Date(Date.UTC(2026, 0, 10)),
      transactionDate: new Date(Date.UTC(2026, 0, 10)),
      amount: d(-34.9),
      groupId: "group-mensal",
      intervalMonths: 1,
    });

    expect(result).toHaveLength(25); // mês 0 até mês 24, inclusive
    expect(result[0].dueDate.toISOString().slice(0, 10)).toBe("2026-01-10");
    expect(result[24].dueDate.toISOString().slice(0, 10)).toBe("2028-01-10");
    expect(result.every((r) => r.groupId === "group-mensal")).toBe(true);
  });

  it("Bimestral (intervalMonths=2) espaça as ocorrências de 2 em 2 meses", () => {
    const result = generateRecurrenceOccurrences({
      firstDueDate: new Date(Date.UTC(2026, 0, 15)),
      transactionDate: new Date(Date.UTC(2026, 0, 15)),
      amount: d(-100),
      groupId: "group-bimestral",
      intervalMonths: 2,
      monthsAhead: 6,
    });

    expect(result.map((r) => r.dueDate.toISOString().slice(0, 10))).toEqual([
      "2026-01-15",
      "2026-03-15",
      "2026-05-15",
      "2026-07-15",
    ]);
  });

  it("rejeita intervalMonths menor que 1", () => {
    expect(() =>
      generateRecurrenceOccurrences({
        firstDueDate: new Date(),
        transactionDate: new Date(),
        amount: d(-1),
        groupId: "group-x",
        intervalMonths: 0,
      }),
    ).toThrow();
  });
});
