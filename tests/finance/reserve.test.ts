import { describe, expect, it } from "vitest";
import { averageMonthlyExpense } from "@/lib/finance/reserve";
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
