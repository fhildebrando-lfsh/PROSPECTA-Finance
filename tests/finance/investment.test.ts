import { describe, expect, it } from "vitest";
import {
  investmentAcquisitionValue,
  investmentGainLoss,
  investmentIncomeTotal,
  investmentPositionValue,
  investmentReturnPct,
  investmentTotalReturnPct,
  portfolioAllocation,
  type InvestmentPositionEntry,
} from "@/lib/finance/investment";
import { d } from "./helpers";

function entry(overrides: Partial<InvestmentPositionEntry> = {}): InvestmentPositionEntry {
  return { amount: d(0), categorySlug: "aportes", ...overrides };
}

describe("investmentPositionValue — valor atual da posição", () => {
  it("soma aporte + ganho de capital − perdas − retiradas", () => {
    const entries = [
      entry({ categorySlug: "aportes", amount: d(10000) }),
      entry({ categorySlug: "ganho_de_capital", amount: d(1500) }),
      entry({ categorySlug: "perdas", amount: d(-300) }),
      entry({ categorySlug: "retiradas", amount: d(-2000) }),
    ];
    expect(investmentPositionValue(entries).toNumber()).toBe(9200);
  });

  it("retorna zero pra posição sem nenhum lançamento", () => {
    expect(investmentPositionValue([])).toEqual(d(0));
  });
});

describe("investmentAcquisitionValue — base de custo", () => {
  it("soma só as entradas de categoria 'aportes', ignora o resto", () => {
    const entries = [
      entry({ categorySlug: "aportes", amount: d(5000) }),
      entry({ categorySlug: "aportes", amount: d(2000) }),
      entry({ categorySlug: "ganho_de_capital", amount: d(800) }),
    ];
    expect(investmentAcquisitionValue(entries).toNumber()).toBe(7000);
  });
});

describe("investmentGainLoss / investmentReturnPct", () => {
  it("ganho de capital positivo quando a posição vale mais do que foi aportado", () => {
    const entries = [
      entry({ categorySlug: "aportes", amount: d(10000) }),
      entry({ categorySlug: "ganho_de_capital", amount: d(2000) }),
    ];
    expect(investmentGainLoss(entries).toNumber()).toBe(2000);
    expect(investmentReturnPct(entries).toNumber()).toBe(20);
  });

  it("ganho de capital negativo (perda) reduz a rentabilidade", () => {
    const entries = [
      entry({ categorySlug: "aportes", amount: d(10000) }),
      entry({ categorySlug: "perdas", amount: d(-1000) }),
    ];
    expect(investmentGainLoss(entries).toNumber()).toBe(-1000);
    expect(investmentReturnPct(entries).toNumber()).toBe(-10);
  });

  it("rentabilidade é zero (não divide por zero) sem nenhum aporte ainda", () => {
    expect(investmentReturnPct([])).toEqual(d(0));
  });
});

describe("investmentIncomeTotal / investmentTotalReturnPct — retorno total", () => {
  it("retorno total soma ganho de capital + renda recebida, sobre o aportado", () => {
    const entries = [
      entry({ categorySlug: "aportes", amount: d(10000) }),
      entry({ categorySlug: "ganho_de_capital", amount: d(1000) }),
    ];
    const income = [{ amount: d(300) }, { amount: d(200) }];

    expect(investmentIncomeTotal(income).toNumber()).toBe(500);
    // (1000 ganho + 500 renda) / 10000 = 15%
    expect(investmentTotalReturnPct(entries, income).toNumber()).toBe(15);
  });

  it("retorno total é zero sem nenhum aporte ainda", () => {
    expect(investmentTotalReturnPct([], [])).toEqual(d(0));
  });
});

describe("portfolioAllocation — alocação por classe", () => {
  it("agrupa e soma por classCode, com percentual sobre o total da carteira", () => {
    const slices = portfolioAllocation([
      { classCode: "RENDA_FIXA", classLabel: "Renda Fixa", currentValue: d(6000) },
      { classCode: "RENDA_VARIAVEL", classLabel: "Renda Variável", currentValue: d(3000) },
      { classCode: "RENDA_FIXA", classLabel: "Renda Fixa", currentValue: d(1000) },
    ]);

    expect(slices).toHaveLength(2);
    const rendaFixa = slices.find((s) => s.classCode === "RENDA_FIXA")!;
    const rendaVariavel = slices.find((s) => s.classCode === "RENDA_VARIAVEL")!;
    expect(rendaFixa.value.toNumber()).toBe(7000);
    expect(rendaFixa.percentage.toNumber()).toBe(70);
    expect(rendaVariavel.value.toNumber()).toBe(3000);
    expect(rendaVariavel.percentage.toNumber()).toBe(30);
  });

  it("percentual é zero (não divide por zero) numa carteira vazia/zerada", () => {
    const slices = portfolioAllocation([{ classCode: "OUTROS", classLabel: "Outros", currentValue: d(0) }]);
    expect(slices[0].percentage.toNumber()).toBe(0);
  });

  it("lista vazia devolve alocação vazia", () => {
    expect(portfolioAllocation([])).toEqual([]);
  });
});
