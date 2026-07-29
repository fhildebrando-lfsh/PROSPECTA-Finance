import { describe, expect, it } from "vitest";
import { averageMonthlyExpense, emergencyReserveCoverage, emergencyReserveTarget, reserveGaugeBand } from "@/lib/finance/reserve";
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
});

describe("emergencyReserveTarget / emergencyReserveCoverage (§11.6)", () => {
  it("meta = despesa média × meses alvo (default 6)", () => {
    expect(emergencyReserveTarget(d(1000)).toNumber()).toBe(6000);
    expect(emergencyReserveTarget(d(1000), 9).toNumber()).toBe(9000);
  });

  it("cobertura = saldo da reserva / meta", () => {
    const coverage = emergencyReserveCoverage(d(3000), d(1000), 6);
    expect(coverage.target.toNumber()).toBe(6000);
    expect(coverage.ratio.toNumber()).toBe(0.5);
    expect(coverage.percentage.toNumber()).toBe(50);
  });

  it("meta zero não quebra (retorna 0 em vez de dividir por zero)", () => {
    const coverage = emergencyReserveCoverage(d(100), d(0));
    expect(coverage.ratio.toNumber()).toBe(0);
  });
});

describe("reserveGaugeBand (§11.6)", () => {
  it("vermelho até 33%, âmbar até 66%, verde acima", () => {
    expect(reserveGaugeBand(0)).toBe("vermelho");
    expect(reserveGaugeBand(32.9)).toBe("vermelho");
    expect(reserveGaugeBand(33)).toBe("ambar");
    expect(reserveGaugeBand(65.9)).toBe("ambar");
    expect(reserveGaugeBand(66)).toBe("verde");
    expect(reserveGaugeBand(150)).toBe("verde");
  });
});
