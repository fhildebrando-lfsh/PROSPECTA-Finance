import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import { buildReservePlan, treatmentPlan, type ReservePlanInput, type TreatmentInput } from "@/lib/method/mcrf/plan-engine";

function plano(overrides: Partial<ReservePlanInput> = {}): ReservePlanInput {
  return {
    target: new Decimal(30000),
    current: new Decimal(6000),
    rendaMensal: new Decimal(8000),
    custoEssencialMensal: new Decimal(5000),
    fracaoDoExcedente: 0.5,
    receitasExtraordinariasAnuais: new Decimal(0),
    ...overrides,
  };
}

describe("buildReservePlan", () => {
  it("o aporte sai do que sobra depois do essencial, não da renda cheia", () => {
    // §44: não comprometer despesas essenciais. Sobra 3.000; metade vai pra reserva.
    const r = buildReservePlan(plano());
    expect(r.excedenteMensal.toString()).toBe("3000");
    expect(r.aporteMensal.toString()).toBe("1500");
  });

  it("calcula o prazo até a meta", () => {
    // Faltam 24.000 e entram 1.500/mês → 16 meses.
    expect(buildReservePlan(plano()).mesesAteMeta).toBe(16);
  });

  it("13º e bônus encurtam o prazo sem apertar o mês a mês", () => {
    const semExtra = buildReservePlan(plano());
    const comExtra = buildReservePlan(plano({ receitasExtraordinariasAnuais: new Decimal(12000) }));

    expect(comExtra.aporteExtraordinarioMensalizado.toString()).toBe("1000");
    expect(comExtra.mesesAteMeta!).toBeLessThan(semExtra.mesesAteMeta!);
    // O aporte mensal do orçamento não mudou — só entrou dinheiro que já existia.
    expect(comExtra.aporteMensal.toString()).toBe(semExtra.aporteMensal.toString());
  });

  /**
   * §44 — sem folga não há prazo realista. O resultado não é "impossível": é
   * um sinal de que o caminho passa por reduzir despesa ou aumentar renda
   * antes de falar em meta (§40).
   */
  it("sem folga no orçamento não inventa prazo", () => {
    const r = buildReservePlan(plano({ custoEssencialMensal: new Decimal(8500) }));
    expect(r.semCapacidadeDePoupanca).toBe(true);
    expect(r.excedenteMensal.toString()).toBe("0"); // nunca negativo
    expect(r.mesesAteMeta).toBeNull();
  });

  it("meta já atingida devolve prazo zero e nada a construir", () => {
    const r = buildReservePlan(plano({ current: new Decimal(40000) }));
    expect(r.metaAtingida).toBe(true);
    expect(r.mesesAteMeta).toBe(0);
    expect(r.faltaConstruir.toString()).toBe("0");
  });

  it("direcionar todo o excedente encurta o prazo; nada, elimina", () => {
    expect(buildReservePlan(plano({ fracaoDoExcedente: 1 })).mesesAteMeta).toBe(8);
    expect(buildReservePlan(plano({ fracaoDoExcedente: 0 })).mesesAteMeta).toBeNull();
  });

  it("fração fora de 0–1 é contida em vez de quebrar o cálculo", () => {
    expect(buildReservePlan(plano({ fracaoDoExcedente: 5 })).aporteMensal.toString()).toBe("3000");
    expect(buildReservePlan(plano({ fracaoDoExcedente: -2 })).aporteMensal.toString()).toBe("0");
  });
});

describe("treatmentPlan", () => {
  function entrada(overrides: Partial<TreatmentInput> = {}): TreatmentInput {
    return {
      temSegundaAtividadeResiliente: true,
      temSeguroContratado: true,
      correlacaoRendaAlta: false,
      rigidezPct: 20,
      concentracaoRenda: 0.3,
      semCapacidadeDePoupanca: false,
      ...overrides,
    };
  }

  /**
   * §5 — "a solução para todo risco não deve ser simplesmente aumentar a
   * reserva". Transferir e diversificar reduzem a necessidade na origem.
   */
  it("sem seguro, sugere transferir o risco em vez de guardar mais", () => {
    const s = treatmentPlan(entrada({ temSeguroContratado: false }));
    expect(s.some((x) => x.estrategia === "transferir")).toBe(true);
  });

  it("sem segunda atividade, sugere diversificar", () => {
    const s = treatmentPlan(entrada({ temSegundaAtividadeResiliente: false }));
    expect(s.some((x) => x.estrategia === "diversificar")).toBe(true);
  });

  it("rigidez alta sugere reduzir despesa presa", () => {
    const s = treatmentPlan(entrada({ rigidezPct: 70 }));
    expect(s.some((x) => x.estrategia === "reduzir")).toBe(true);
  });

  it("renda familiar correlacionada vira recomendação própria", () => {
    const s = treatmentPlan(entrada({ correlacaoRendaAlta: true }));
    expect(s.some((x) => x.acao.includes("mesma fonte pagadora"))).toBe(true);
  });

  it("perfil já tratado recebe orientação de manter, não uma lista vazia", () => {
    const s = treatmentPlan(entrada());
    expect(s).toHaveLength(1);
    expect(s[0].estrategia).toBe("reter");
  });

  it("dado ausente não vira acusação", () => {
    // Sem rigidez nem concentração medidas, não sugere reduzir o que não se sabe.
    const s = treatmentPlan(entrada({ rigidezPct: null, concentracaoRenda: null }));
    expect(s.some((x) => x.acao.includes("Reduzir despesas rígidas"))).toBe(false);
  });
});
