import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  evaluateAutomationRule,
  evaluateIncidenteAcumulado,
  evaluateLimiarCategoria,
  evaluateMetaForaDaTrajetoria,
  evaluateVariacaoRecorrencia,
  evaluateVencimentoProximo,
  limiarPeriodRange,
  type AutomationEntry,
  type AutomationGoal,
} from "@/lib/method/automation-engine";

let counter = 0;
function makeEntry(overrides: Partial<AutomationEntry> = {}): AutomationEntry {
  counter += 1;
  return {
    id: `entry-${counter}`,
    categoryId: "cat-1",
    categoryName: "Alimentação",
    nature: "DESPESA",
    amount: new Decimal(-100),
    dueDate: new Date(Date.UTC(2026, 5, 15)),
    status: "PAGO",
    groupId: null,
    description: "[teste]",
    ...overrides,
  };
}

const HOJE = new Date(Date.UTC(2026, 5, 15));

/**
 * Seletor de período (2026-08-17). A regra antiga não tinha o campo e era
 * sempre mensal — a retrocompatibilidade é a parte que não pode quebrar, já
 * que mudaria em silêncio o significado de regra que o usuário já criou.
 */
describe("limiarPeriodRange", () => {
  // 2026-06-15 é uma segunda-feira.
  const SEGUNDA = new Date(Date.UTC(2026, 5, 15));
  const QUARTA = new Date(Date.UTC(2026, 5, 17));
  const DOMINGO = new Date(Date.UTC(2026, 5, 21));

  it("DIA começa e termina no mesmo dia", () => {
    const r = limiarPeriodRange("DIA", QUARTA);
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-06-17");
    expect(r.end.toISOString().slice(0, 10)).toBe("2026-06-17");
    expect(r.label).toBe("hoje");
  });

  it("SEMANA vai de segunda a domingo", () => {
    const r = limiarPeriodRange("SEMANA", QUARTA);
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-06-15");
    expect(r.end.toISOString().slice(0, 10)).toBe("2026-06-21");
  });

  it("na própria segunda, a semana começa nela", () => {
    expect(limiarPeriodRange("SEMANA", SEGUNDA).start.toISOString().slice(0, 10)).toBe("2026-06-15");
  });

  it("no domingo, a semana ainda é a que começou na segunda anterior", () => {
    // O caso que uma implementação ingênua erra: getUTCDay() do domingo é 0.
    const r = limiarPeriodRange("SEMANA", DOMINGO);
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-06-15");
    expect(r.end.toISOString().slice(0, 10)).toBe("2026-06-21");
  });

  it("a semana pode atravessar a virada do mês", () => {
    // 2026-07-01 é uma quarta; a semana começou em 29/06.
    const r = limiarPeriodRange("SEMANA", new Date(Date.UTC(2026, 6, 1)));
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-06-29");
  });

  it("MES é o mês de calendário", () => {
    const r = limiarPeriodRange("MES", QUARTA);
    expect(r.start.toISOString().slice(0, 10)).toBe("2026-06-01");
    expect(r.end.toISOString().slice(0, 10)).toBe("2026-06-30");
  });
});

describe("evaluateLimiarCategoria — período", () => {
  const QUARTA = new Date(Date.UTC(2026, 5, 17));
  const cond = (periodo?: "DIA" | "SEMANA" | "MES") => ({
    categoryId: "cat-1",
    categoryName: "Alimentação",
    thresholdAmount: 500,
    ...(periodo ? { periodo } : {}),
  });

  it("regra sem o campo continua mensal — retrocompatibilidade", () => {
    // Gasto no dia 2, fora da semana corrente mas dentro do mês: só dispara se
    // a janela for mensal, que é o que a regra antiga significava.
    const entries = [makeEntry({ amount: new Decimal(-600), dueDate: new Date(Date.UTC(2026, 5, 2)) })];
    const r = evaluateLimiarCategoria(entries, cond(), QUARTA);
    expect(r).not.toBeNull();
    expect(r?.message).toContain("este mês");
  });

  it("a mesma despesa não dispara a regra semanal", () => {
    const entries = [makeEntry({ amount: new Decimal(-600), dueDate: new Date(Date.UTC(2026, 5, 2)) })];
    expect(evaluateLimiarCategoria(entries, cond("SEMANA"), QUARTA)).toBeNull();
  });

  it("gasto de hoje dispara a regra diária, e a mensagem diz \"hoje\"", () => {
    const entries = [makeEntry({ amount: new Decimal(-600), dueDate: QUARTA })];
    const r = evaluateLimiarCategoria(entries, cond("DIA"), QUARTA);
    expect(r?.message).toContain("hoje");
  });

  it("gasto de ontem não conta na regra diária", () => {
    const entries = [makeEntry({ amount: new Decimal(-600), dueDate: new Date(Date.UTC(2026, 5, 16)) })];
    expect(evaluateLimiarCategoria(entries, cond("DIA"), QUARTA)).toBeNull();
  });

  it("a regra semanal soma os dias da semana corrente", () => {
    const entries = [
      makeEntry({ amount: new Decimal(-300), dueDate: new Date(Date.UTC(2026, 5, 15)) }),
      makeEntry({ amount: new Decimal(-300), dueDate: new Date(Date.UTC(2026, 5, 17)) }),
    ];
    const r = evaluateLimiarCategoria(entries, cond("SEMANA"), QUARTA);
    expect(r?.message).toContain("esta semana");
  });
});

describe("evaluateLimiarCategoria", () => {
  it("dispara quando o gasto do mês na categoria passa do limite", () => {
    const entries = [makeEntry({ amount: new Decimal(-600) })];
    const result = evaluateLimiarCategoria(
      entries,
      { categoryId: "cat-1", categoryName: "Alimentação", thresholdAmount: 500 },
      HOJE,
    );
    expect(result).not.toBeNull();
    expect(result?.message).toContain("Alimentação");
  });

  it("não dispara abaixo do limite", () => {
    const entries = [makeEntry({ amount: new Decimal(-100) })];
    const result = evaluateLimiarCategoria(
      entries,
      { categoryId: "cat-1", categoryName: "Alimentação", thresholdAmount: 500 },
      HOJE,
    );
    expect(result).toBeNull();
  });

  it("ignora despesa pendente (só liquidado conta)", () => {
    const entries = [makeEntry({ amount: new Decimal(-600), status: "A_PAGAR" })];
    const result = evaluateLimiarCategoria(
      entries,
      { categoryId: "cat-1", categoryName: "Alimentação", thresholdAmount: 500 },
      HOJE,
    );
    expect(result).toBeNull();
  });

  it("ignora outra categoria", () => {
    const entries = [makeEntry({ amount: new Decimal(-600), categoryId: "cat-2" })];
    const result = evaluateLimiarCategoria(
      entries,
      { categoryId: "cat-1", categoryName: "Alimentação", thresholdAmount: 500 },
      HOJE,
    );
    expect(result).toBeNull();
  });

  it("ignora despesa fora do mês corrente", () => {
    const entries = [makeEntry({ amount: new Decimal(-600), dueDate: new Date(Date.UTC(2026, 4, 15)) })];
    const result = evaluateLimiarCategoria(
      entries,
      { categoryId: "cat-1", categoryName: "Alimentação", thresholdAmount: 500 },
      HOJE,
    );
    expect(result).toBeNull();
  });
});

describe("evaluateVencimentoProximo", () => {
  it("dispara para compromisso pendente dentro da janela", () => {
    const entries = [
      makeEntry({ status: "A_PAGAR", dueDate: new Date(Date.UTC(2026, 5, 17)), amount: new Decimal(-200) }),
    ];
    const result = evaluateVencimentoProximo(entries, { daysBefore: 3 }, HOJE);
    expect(result).not.toBeNull();
    expect(result?.message).toContain("1 compromisso");
  });

  it("não dispara para compromisso fora da janela", () => {
    const entries = [
      makeEntry({ status: "A_PAGAR", dueDate: new Date(Date.UTC(2026, 5, 25)), amount: new Decimal(-200) }),
    ];
    const result = evaluateVencimentoProximo(entries, { daysBefore: 3 }, HOJE);
    expect(result).toBeNull();
  });

  it("não dispara pra lançamento já liquidado", () => {
    const entries = [makeEntry({ status: "PAGO", dueDate: new Date(Date.UTC(2026, 5, 16)) })];
    const result = evaluateVencimentoProximo(entries, { daysBefore: 3 }, HOJE);
    expect(result).toBeNull();
  });

  it("não dispara pra compromisso já vencido (dias negativos)", () => {
    const entries = [makeEntry({ status: "A_PAGAR", dueDate: new Date(Date.UTC(2026, 5, 10)) })];
    const result = evaluateVencimentoProximo(entries, { daysBefore: 3 }, HOJE);
    expect(result).toBeNull();
  });
});

describe("evaluateVariacaoRecorrencia", () => {
  it("dispara quando a ocorrência mais recente varia acima do limite", () => {
    const entries = [
      makeEntry({ groupId: "g1", amount: new Decimal(-30), dueDate: new Date(Date.UTC(2026, 4, 10)) }),
      makeEntry({ groupId: "g1", amount: new Decimal(-50), dueDate: new Date(Date.UTC(2026, 5, 10)) }),
    ];
    const result = evaluateVariacaoRecorrencia(entries, { percentThreshold: 20 });
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain("subiu");
  });

  it("detecta queda também, não só alta", () => {
    const entries = [
      makeEntry({ groupId: "g1", amount: new Decimal(-100), dueDate: new Date(Date.UTC(2026, 4, 10)) }),
      makeEntry({ groupId: "g1", amount: new Decimal(-50), dueDate: new Date(Date.UTC(2026, 5, 10)) }),
    ];
    const result = evaluateVariacaoRecorrencia(entries, { percentThreshold: 20 });
    expect(result[0].message).toContain("caiu");
  });

  it("não dispara dentro da tolerância", () => {
    const entries = [
      makeEntry({ groupId: "g1", amount: new Decimal(-100), dueDate: new Date(Date.UTC(2026, 4, 10)) }),
      makeEntry({ groupId: "g1", amount: new Decimal(-105), dueDate: new Date(Date.UTC(2026, 5, 10)) }),
    ];
    const result = evaluateVariacaoRecorrencia(entries, { percentThreshold: 20 });
    expect(result).toHaveLength(0);
  });

  it("ignora lançamento sem groupId (não é recorrência)", () => {
    const entries = [makeEntry({ groupId: null })];
    const result = evaluateVariacaoRecorrencia(entries, { percentThreshold: 20 });
    expect(result).toHaveLength(0);
  });

  it("precisa de pelo menos 2 ocorrências liquidadas pra comparar", () => {
    const entries = [makeEntry({ groupId: "g1" })];
    const result = evaluateVariacaoRecorrencia(entries, { percentThreshold: 20 });
    expect(result).toHaveLength(0);
  });
});

function makeGoal(overrides: Partial<AutomationGoal> = {}): AutomationGoal {
  return {
    id: "goal-1",
    name: "Reserva de emergência",
    targetAmount: new Decimal(12000),
    targetDate: new Date(Date.UTC(2027, 5, 15)), // 1 ano à frente
    createdAt: new Date(Date.UTC(2026, 5, 15)),
    currentBalance: new Decimal(6000),
    ...overrides,
  };
}

describe("evaluateMetaForaDaTrajetoria", () => {
  it("dispara quando o saldo está bem abaixo do ritmo esperado", () => {
    const meioDoCaminho = new Date(Date.UTC(2027, 0, 15)); // ~6 meses de 12
    const goal = makeGoal({ currentBalance: new Decimal(1000) }); // esperado ~6000
    const result = evaluateMetaForaDaTrajetoria([goal], meioDoCaminho);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain("Reserva de emergência");
  });

  it("não dispara quando o saldo está no ritmo ou acima", () => {
    const meioDoCaminho = new Date(Date.UTC(2027, 0, 15)); // ~214 de 365 dias, esperado ~7032
    const goal = makeGoal({ currentBalance: new Decimal(8000) });
    const result = evaluateMetaForaDaTrajetoria([goal], meioDoCaminho);
    expect(result).toHaveLength(0);
  });

  it("ignora meta sem data-alvo", () => {
    const goal = makeGoal({ targetDate: null, currentBalance: new Decimal(0) });
    const result = evaluateMetaForaDaTrajetoria([goal], HOJE);
    expect(result).toHaveLength(0);
  });
});

describe("evaluateIncidenteAcumulado", () => {
  it("dispara quando a fila passa do limite", () => {
    const result = evaluateIncidenteAcumulado(5, { thresholdCount: 3 });
    expect(result).toHaveLength(1);
  });

  it("não dispara abaixo do limite", () => {
    const result = evaluateIncidenteAcumulado(2, { thresholdCount: 3 });
    expect(result).toHaveLength(0);
  });
});

describe("evaluateAutomationRule (orquestrador)", () => {
  it("despacha corretamente pro avaliador certo por trigger", () => {
    const context = {
      entries: [makeEntry({ amount: new Decimal(-600) })],
      goals: [],
      openIncidentCount: 0,
      today: HOJE,
    };
    const result = evaluateAutomationRule(
      { trigger: "LIMIAR_CATEGORIA", condition: { categoryId: "cat-1", categoryName: "Alimentação", thresholdAmount: 500 } },
      context,
    );
    expect(result).toHaveLength(1);
  });
});
