import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  learnFromShocks,
  recompositionPlan,
  recompositionStatus,
  type ShockRecord,
} from "@/lib/method/mcrf/shock-engine";

let counter = 0;
function choque(overrides: Partial<ShockRecord> = {}): ShockRecord {
  counter += 1;
  return {
    id: `s-${counter}`,
    kind: "DESPESA_INESPERADA",
    description: `evento ${counter}`,
    occurredAt: new Date(Date.UTC(2026, 0, 10)),
    extraordinaryExpense: null,
    incomeLossMonthly: null,
    durationMonths: null,
    hadInsurance: null,
    reimbursedAmount: null,
    paidByUserAmount: null,
    daysUntilReimbursement: null,
    reserveUsedAmount: null,
    recomposedAt: null,
    ...overrides,
  };
}

describe("learnFromShocks", () => {
  it("sem histórico não aprende nada, e não inventa", () => {
    const r = learnFromShocks([]);
    expect(r.maiorDesembolsoObservado.toString()).toBe("0");
    expect(r.eventoDeterminante).toBeNull();
    expect(r.explicacoes).toHaveLength(0);
  });

  it("acha o maior desembolso do próprio bolso", () => {
    const r = learnFromShocks([
      choque({ description: "pneu", paidByUserAmount: new Decimal(1200) }),
      choque({ description: "cirurgia do gato", paidByUserAmount: new Decimal(6500) }),
    ]);
    expect(r.maiorDesembolsoObservado.toString()).toBe("6500");
    expect(r.eventoDeterminante?.description).toBe("cirurgia do gato");
  });

  it("desconta o reembolso — o que o seguro cobriu não saiu do bolso", () => {
    const r = learnFromShocks([
      choque({ extraordinaryExpense: new Decimal(20000), reimbursedAmount: new Decimal(17000) }),
    ]);
    expect(r.maiorDesembolsoObservado.toString()).toBe("3000");
  });

  it("reembolso maior que a despesa não vira desembolso negativo", () => {
    const r = learnFromShocks([
      choque({ extraordinaryExpense: new Decimal(5000), reimbursedAmount: new Decimal(6000) }),
    ]);
    expect(r.maiorDesembolsoObservado.toString()).toBe("0");
  });

  /**
   * §46 exige que a inferência seja identificável. O motor nunca devolve só um
   * número: devolve qual evento o produziu e uma frase que a tela pode mostrar.
   */
  it("toda inferência vem com a explicação de onde saiu", () => {
    const r = learnFromShocks([choque({ description: "reparo no telhado", paidByUserAmount: new Decimal(4000) })]);
    expect(r.explicacoes.join(" ")).toContain("reparo no telhado");
    expect(r.eventoDeterminante).not.toBeNull();
  });

  it("mede o prazo real de indenização — evidência contra o que a apólice promete", () => {
    const r = learnFromShocks([
      choque({ hadInsurance: true, daysUntilReimbursement: 30 }),
      choque({ hadInsurance: true, daysUntilReimbursement: 90 }),
      choque({ hadInsurance: true, daysUntilReimbursement: 60 }),
    ]);
    expect(r.prazoRealDeIndenizacaoDias).toBe(60);
    expect(r.eventosComSeguro).toBe(3);
  });

  it("evento sem seguro não entra na mediana de prazo", () => {
    const r = learnFromShocks([
      choque({ hadInsurance: false, daysUntilReimbursement: 5 }),
      choque({ hadInsurance: true, daysUntilReimbursement: 45 }),
    ]);
    expect(r.prazoRealDeIndenizacaoDias).toBe(45);
  });

  it("aponta padrão de choques sem seguro, a partir de dois casos", () => {
    const r = learnFromShocks([
      choque({ hadInsurance: false, paidByUserAmount: new Decimal(3000) }),
      choque({ hadInsurance: false, paidByUserAmount: new Decimal(2000) }),
    ]);
    expect(r.explicacoes.join(" ")).toContain("sem nenhum seguro");
  });

  it("um único caso sem seguro não vira padrão", () => {
    const r = learnFromShocks([choque({ hadInsurance: false, paidByUserAmount: new Decimal(3000) })]);
    expect(r.explicacoes.join(" ")).not.toContain("sem nenhum seguro");
  });
});

describe("recompositionStatus", () => {
  it("separa o que já foi reposto do que ainda falta", () => {
    const r = recompositionStatus([
      choque({ reserveUsedAmount: new Decimal(5000), recomposedAt: new Date() }),
      choque({ reserveUsedAmount: new Decimal(3000), recomposedAt: null }),
      choque({ reserveUsedAmount: new Decimal(2000), recomposedAt: null }),
    ]);

    expect(r.totalJaConsumido.toString()).toBe("10000");
    expect(r.totalAReporr.toString()).toBe("5000");
    expect(r.pendentes).toHaveLength(2);
  });

  it("evento que não tocou na reserva fica de fora", () => {
    const r = recompositionStatus([choque({ extraordinaryExpense: new Decimal(9000) })]);
    expect(r.totalJaConsumido.toString()).toBe("0");
    expect(r.pendentes).toHaveLength(0);
  });

  it("sem evento nenhum devolve zero, não quebra", () => {
    expect(recompositionStatus([]).totalAReporr.toString()).toBe("0");
  });
});

describe("recompositionPlan", () => {
  it("calcula o prazo para repor", () => {
    expect(recompositionPlan(new Decimal(6000), new Decimal(1000))).toBe(6);
  });

  it("nada a repor devolve zero", () => {
    expect(recompositionPlan(new Decimal(0), new Decimal(1000))).toBe(0);
  });

  /** Mesmo tratamento de `plan-engine.ts`: sem aporte, prazo é ficção. */
  it("sem capacidade de aporte não inventa prazo", () => {
    expect(recompositionPlan(new Decimal(6000), new Decimal(0))).toBeNull();
  });

  it("arredonda para cima — meio mês não repõe nada", () => {
    expect(recompositionPlan(new Decimal(6500), new Decimal(1000))).toBe(7);
  });
});
