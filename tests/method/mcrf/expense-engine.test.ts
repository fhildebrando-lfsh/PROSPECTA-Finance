import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  computeExpenseBaseline,
  indiceRigidezFinanceira,
  type ExpenseEntry,
} from "@/lib/method/mcrf/expense-engine";

const HOJE = new Date(Date.UTC(2026, 6, 15)); // meses fechados: jun, mai, abr...

function despesa(
  valor: number,
  monthsAgo: number,
  rigidez: ExpenseEntry["rigidez"],
  isPeriodic = false,
): ExpenseEntry {
  return {
    amount: new Decimal(-valor),
    dueDate: new Date(Date.UTC(2026, 6 - monthsAgo, 10)),
    status: "PAGO",
    nature: "DESPESA",
    rigidez,
    isPeriodic,
  };
}

/** Mesma despesa repetida em N meses fechados. */
function todoMes(valor: number, meses: number, rigidez: ExpenseEntry["rigidez"]): ExpenseEntry[] {
  return Array.from({ length: meses }, (_, i) => despesa(valor, i + 1, rigidez));
}

describe("computeExpenseBaseline — CEMA e CCM", () => {
  it("CCM é menor que CEMA: a ajustável comprime, a rígida não", () => {
    const entries = [...todoMes(2000, 6, "RIGIDA"), ...todoMes(1000, 6, "AJUSTAVEL")];
    const r = computeExpenseBaseline(entries, HOJE, 6, 30);

    expect(r.cema.toString()).toBe("3000");
    // rígida 2000 + ajustável 1000 × 70% = 2700
    expect(r.ccm.toString()).toBe("2700");
  });

  it("discricionária fica fora dos dois — não é custo essencial nem de contingência", () => {
    const entries = [...todoMes(2000, 6, "RIGIDA"), ...todoMes(800, 6, "DISCRICIONARIA")];
    const r = computeExpenseBaseline(entries, HOJE, 6, 30);

    expect(r.cema.toString()).toBe("2000");
    expect(r.ccm.toString()).toBe("2000");
    // mas continua visível para a tela poder explicar
    expect(r.discricionariasMensais.toString()).toBe("800");
  });

  it("com 100% de redução a ajustável zera; com 0% o CCM iguala o CEMA", () => {
    const entries = [...todoMes(2000, 6, "RIGIDA"), ...todoMes(1000, 6, "AJUSTAVEL")];
    expect(computeExpenseBaseline(entries, HOJE, 6, 100).ccm.toString()).toBe("2000");
    expect(computeExpenseBaseline(entries, HOJE, 6, 0).ccm.toString()).toBe("3000");
  });

  /**
   * O erro que a especificação não menciona: se a despesa anual ficasse na
   * série mensal, ela entraria na mediana daquele mês E de novo como duodécimo.
   */
  it("despesa periódica não conta duas vezes — sai da mediana e volta como duodécimo", () => {
    const entries = [
      ...todoMes(1000, 12, "RIGIDA"),
      despesa(2400, 3, "RIGIDA", true), // IPVA anual num único mês
    ];
    const r = computeExpenseBaseline(entries, HOJE, 12, 30);

    // A mediana das rígidas continua 1000 — o IPVA não distorceu o mês dele.
    expect(r.rigidasMensais.toString()).toBe("1000");
    // E entra rateado: 2400 / 12 = 200.
    expect(r.periodicasMensalizadas.toString()).toBe("200");
    expect(r.cema.toString()).toBe("1200");
  });

  it("periódica discricionária não vira provisão essencial", () => {
    const entries = [...todoMes(1000, 12, "RIGIDA"), despesa(6000, 2, "DISCRICIONARIA", true)];
    const r = computeExpenseBaseline(entries, HOJE, 12, 30);
    expect(r.periodicasMensalizadas.toString()).toBe("0");
    expect(r.cema.toString()).toBe("1000");
  });

  it("usa mediana, não média — um mês atípico não infla a reserva", () => {
    // 5 meses de 1.000 e um mês de 7.000 (emergência médica pontual).
    const entries = [...todoMes(1000, 5, "AJUSTAVEL"), despesa(7000, 6, "AJUSTAVEL")];
    const r = computeExpenseBaseline(entries, HOJE, 6, 30);

    expect(r.ajustaveisMensais.toString()).toBe("1000"); // média seria 2000
  });

  /**
   * Escolha conservadora e deliberada: sem decisão humana sobre a rigidez,
   * assumir que a despesa comprime reduziria a reserva com base em nada.
   */
  it("essencial sem classificação entra como rígida e reduz a confiança", () => {
    const entries = [...todoMes(1000, 12, "RIGIDA"), ...todoMes(500, 12, null)];
    const r = computeExpenseBaseline(entries, HOJE, 12, 30);

    expect(r.naoClassificadasMensais.toString()).toBe("500");
    expect(r.cema.toString()).toBe("1500");
    expect(r.ccm.toString()).toBe("1500"); // não comprimiu
    expect(r.confidence).toBe("ALTA"); // não MUITO_ALTA, por causa da não classificada
  });

  it("com tudo classificado e 12 meses, a confiança é máxima", () => {
    const r = computeExpenseBaseline(todoMes(1000, 12, "RIGIDA"), HOJE, 12, 30);
    expect(r.confidence).toBe("MUITO_ALTA");
    expect(r.monthsObserved).toBe(12);
  });

  it("pouco histórico derruba a confiança sem impedir o cálculo", () => {
    const r = computeExpenseBaseline(todoMes(1000, 2, "RIGIDA"), HOJE, 2, 30);
    expect(r.confidence).toBe("BAIXA");
    expect(r.cema.toString()).toBe("1000");
  });

  it("ignora receita, transferência e despesa ainda não paga", () => {
    const receita: ExpenseEntry = { ...despesa(9000, 1, "RIGIDA"), nature: "RECEITA" };
    const pendente: ExpenseEntry = { ...despesa(9000, 1, "RIGIDA"), status: "A_PAGAR" };
    const r = computeExpenseBaseline([receita, pendente, ...todoMes(1000, 1, "RIGIDA")], HOJE, 1, 30);
    expect(r.cema.toString()).toBe("1000");
  });

  it("ignora o mês corrente — ainda em curso", () => {
    const r = computeExpenseBaseline([...todoMes(1000, 1, "RIGIDA"), despesa(50, 0, "RIGIDA")], HOJE, 1, 30);
    expect(r.cema.toString()).toBe("1000");
  });

  it("sem despesa nenhuma devolve zero, não quebra", () => {
    const r = computeExpenseBaseline([], HOJE, 12, 30);
    expect(r.cema.toString()).toBe("0");
    expect(r.ccm.toString()).toBe("0");
  });
});

describe("indiceRigidezFinanceira", () => {
  it("mede quanto da renda está preso no que não cede", () => {
    expect(indiceRigidezFinanceira(new Decimal(3000), new Decimal(10000))).toBe(30);
  });

  it("renda zero devolve null, nunca zero", () => {
    // Zero significaria "nada preso", o oposto da verdade de quem não tem renda.
    expect(indiceRigidezFinanceira(new Decimal(3000), new Decimal(0))).toBeNull();
  });
});
