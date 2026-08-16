import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  incomeConcentrationHHI,
  observeIncomeByPerson,
  type IncomeObservationEntry,
} from "@/lib/method/mcrf/income-observation";

const HOJE = new Date(Date.UTC(2026, 6, 15)); // julho/2026 — meses fechados: jun, mai, abr...

/** Cria uma entrada de RECEITA liquidada no mês `monthsAgo` (1 = mês fechado anterior). */
function receita(personId: string, amount: number, monthsAgo: number): IncomeObservationEntry {
  return {
    responsibleId: personId,
    amount: new Decimal(amount),
    dueDate: new Date(Date.UTC(2026, 6 - monthsAgo, 10)),
    status: "RECEBIDO",
    nature: "RECEITA",
  };
}

describe("observeIncomeByPerson", () => {
  it("usa mediana, não média — um 13º não pode inflar a renda tida como resiliente", () => {
    // 5 meses de 5.000 e um mês de 20.000 (13º + férias).
    const entries = [
      ...[1, 2, 3, 4, 5].map((m) => receita("p1", 5000, m)),
      receita("p1", 20000, 6),
    ];

    const [obs] = observeIncomeByPerson(entries, ["p1"], HOJE, 6);

    expect(obs.median.toString()).toBe("5000");
    // a média seria 7500 — 50% acima do que a pessoa realmente recebe todo mês
  });

  it("soma vários lançamentos do mesmo mês antes de comparar", () => {
    const entries = [receita("p1", 3000, 1), receita("p1", 2000, 1), receita("p1", 5000, 2)];
    const [obs] = observeIncomeByPerson(entries, ["p1"], HOJE, 2);
    expect(obs.median.toString()).toBe("5000");
  });

  it("conta meses sem renda — sinal de intermitência", () => {
    const entries = [receita("p1", 6000, 1), receita("p1", 6000, 3)];
    const [obs] = observeIncomeByPerson(entries, ["p1"], HOJE, 4);
    expect(obs.monthsWithoutIncome).toBe(2);
    expect(obs.monthsObserved).toBe(4);
  });

  it("registra o pior mês observado, não só a mediana", () => {
    const entries = [receita("p1", 8000, 1), receita("p1", 2000, 2), receita("p1", 8000, 3)];
    const [obs] = observeIncomeByPerson(entries, ["p1"], HOJE, 3);
    expect(obs.worstMonth.toString()).toBe("2000");
    expect(obs.median.toString()).toBe("8000");
  });

  it("mede variabilidade a partir do extrato, sem depender de declaração", () => {
    const estavel = observeIncomeByPerson([1, 2, 3].map((m) => receita("p1", 5000, m)), ["p1"], HOJE, 3)[0];
    const volatil = observeIncomeByPerson(
      [receita("p2", 1000, 1), receita("p2", 5000, 2), receita("p2", 9000, 3)],
      ["p2"],
      HOJE,
      3,
    )[0];

    expect(estavel.variability).toBe(0);
    expect(volatil.variability).toBeGreaterThan(1);
  });

  it("ignora o mês corrente — ainda em curso, entraria como queda artificial", () => {
    const entries = [receita("p1", 5000, 1), receita("p1", 100, 0)];
    const [obs] = observeIncomeByPerson(entries, ["p1"], HOJE, 1);
    expect(obs.median.toString()).toBe("5000");
  });

  it("ignora receita ainda não liquidada e o que não é RECEITA", () => {
    const pendente: IncomeObservationEntry = { ...receita("p1", 9000, 1), status: "A_RECEBER" };
    const despesa: IncomeObservationEntry = { ...receita("p1", -400, 1), nature: "DESPESA" };
    const [obs] = observeIncomeByPerson([pendente, despesa, receita("p1", 5000, 1)], ["p1"], HOJE, 1);
    expect(obs.median.toString()).toBe("5000");
  });

  it("separa a renda por pessoa — base do cenário familiar", () => {
    const entries = [receita("p1", 7000, 1), receita("p2", 3000, 1)];
    const [a, b] = observeIncomeByPerson(entries, ["p1", "p2"], HOJE, 1);
    expect(a.median.toString()).toBe("7000");
    expect(b.median.toString()).toBe("3000");
  });

  it("pessoa sem nenhuma renda observada não quebra o cálculo", () => {
    const [obs] = observeIncomeByPerson([], ["p1"], HOJE, 6);
    expect(obs.median.toString()).toBe("0");
    expect(obs.variability).toBeNull();
    expect(obs.confidence).toBe("BAIXA");
  });

  it("confiança cai quando há histórico curto ou renda intermitente", () => {
    const doze = observeIncomeByPerson(
      Array.from({ length: 12 }, (_, i) => receita("p1", 5000, i + 1)),
      ["p1"],
      HOJE,
      12,
    )[0];
    const dozeComBuracos = observeIncomeByPerson(
      [1, 2, 3].map((m) => receita("p2", 5000, m)),
      ["p2"],
      HOJE,
      12,
    )[0];
    const curto = observeIncomeByPerson([receita("p3", 5000, 1)], ["p3"], HOJE, 3)[0];

    expect(doze.confidence).toBe("MUITO_ALTA");
    expect(dozeComBuracos.confidence).toBe("MODERADA");
    expect(curto.confidence).toBe("BAIXA");
  });
});

describe("incomeConcentrationHHI", () => {
  it("uma única renda concentra tudo", () => {
    expect(incomeConcentrationHHI([new Decimal(5000)])).toBe(1);
  });

  it("duas rendas iguais dão 0,5", () => {
    expect(incomeConcentrationHHI([new Decimal(5000), new Decimal(5000)])).toBeCloseTo(0.5, 6);
  });

  it("renda muito desigual aproxima-se de uma fonte única", () => {
    const hhi = incomeConcentrationHHI([new Decimal(9500), new Decimal(500)])!;
    expect(hhi).toBeGreaterThan(0.9);
  });

  it("sem renda nenhuma devolve null, nunca zero", () => {
    // Zero significaria "perfeitamente diversificado", o oposto da verdade.
    expect(incomeConcentrationHHI([])).toBeNull();
    expect(incomeConcentrationHHI([new Decimal(0)])).toBeNull();
  });
});
