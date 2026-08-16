import { describe, expect, it } from "vitest";
import { averageMonthlyExpense, averageMonthlyIncome } from "@/lib/finance/reserve";
import { d, makeEntry } from "./helpers";

describe("averageMonthlyExpense (§11.6)", () => {
  it("calcula a média das despesas dos últimos N meses FECHADOS, ignorando o mês corrente", () => {
    const referenceDate = new Date(Date.UTC(2026, 5, 15)); // 15/jun/2026 — junho ainda em curso

    const entries = [
      makeEntry({ nature: "DESPESA", amount: d(-1000), dueDate: new Date(Date.UTC(2026, 4, 10)) }), // maio
      makeEntry({ nature: "DESPESA", amount: d(-2000), dueDate: new Date(Date.UTC(2026, 3, 10)) }), // abril
      makeEntry({ nature: "DESPESA", amount: d(-999999), dueDate: new Date(Date.UTC(2026, 5, 10)) }), // junho — não conta
    ];

    // 6 meses fechados antes de junho/2026: dez/25 a mai/26. Só maio e abril têm despesa.
    const avg = averageMonthlyExpense(entries, referenceDate, 6);
    expect(avg.toNumber()).toBe(500); // (1000 + 2000) / 6
  });

  it("retorna zero quando monthsBack é zero", () => {
    expect(averageMonthlyExpense([], new Date(), 0).toNumber()).toBe(0);
  });

  it("exclui despesa pendente (A_PAGAR) da média — só o gasto realizado conta", () => {
    const referenceDate = new Date(Date.UTC(2026, 5, 15)); // 15/jun/2026

    const entries = [
      makeEntry({ nature: "DESPESA", status: "PAGO", amount: d(-600), dueDate: new Date(Date.UTC(2026, 4, 10)) }), // maio, liquidado
      makeEntry({ nature: "DESPESA", status: "A_PAGAR", amount: d(-9999), dueDate: new Date(Date.UTC(2026, 3, 10)) }), // abril, pendente — não conta
    ];

    const avg = averageMonthlyExpense(entries, referenceDate, 6);
    expect(avg.toNumber()).toBe(100); // 600 / 6
  });
});

describe("averageMonthlyIncome (§13.5 — denominador do indicador de Endividamento do PSF, Etapa 5)", () => {
  it("calcula a média das receitas dos últimos N meses FECHADOS, ignorando o mês corrente", () => {
    const referenceDate = new Date(Date.UTC(2026, 5, 15)); // 15/jun/2026

    const entries = [
      makeEntry({ nature: "RECEITA", amount: d(5000), dueDate: new Date(Date.UTC(2026, 4, 10)) }), // maio
      makeEntry({ nature: "RECEITA", amount: d(3000), dueDate: new Date(Date.UTC(2026, 3, 10)) }), // abril
      makeEntry({ nature: "RECEITA", amount: d(999999), dueDate: new Date(Date.UTC(2026, 5, 10)) }), // junho — não conta
    ];

    const avg = averageMonthlyIncome(entries, referenceDate, 6);
    expect(avg.toNumber()).toBe((5000 + 3000) / 6);
  });

  it("retorna zero quando monthsBack é zero", () => {
    expect(averageMonthlyIncome([], new Date(), 0).toNumber()).toBe(0);
  });

  it("exclui receita pendente (A_RECEBER) da média — só o recebido conta", () => {
    const referenceDate = new Date(Date.UTC(2026, 5, 15));

    const entries = [
      makeEntry({ nature: "RECEITA", status: "RECEBIDO", amount: d(1200), dueDate: new Date(Date.UTC(2026, 4, 10)) }),
      makeEntry({ nature: "RECEITA", status: "A_RECEBER", amount: d(9999), dueDate: new Date(Date.UTC(2026, 3, 10)) }),
    ];

    const avg = averageMonthlyIncome(entries, referenceDate, 6);
    expect(avg.toNumber()).toBe(200); // 1200 / 6
  });
});
