import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  evaluateAutomationRule,
  evaluateIncidenteAcumulado,
  evaluateLimiarCategoria,
  evaluateMetaForaDaTrajetoria,
  evaluateVariacaoRecorrencia,
  evaluateVencimentoProximo,
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
