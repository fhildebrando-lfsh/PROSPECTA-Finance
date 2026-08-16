import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  buildScenarios,
  coberturaNoCenario,
  maxCumulativeDrawdown,
  piorCenarioMaterial,
  type MonthlyFlow,
  type ScenarioContext,
} from "@/lib/method/mcrf/scenario-engine";

function fluxo(month: number, saida: number, entrada: number): MonthlyFlow {
  return {
    month,
    essentialOutflow: new Decimal(saida),
    extraordinaryOutflow: new Decimal(0),
    resilientIncome: new Decimal(entrada),
    availableBenefits: new Decimal(0),
    insuranceCashflow: new Decimal(0),
  };
}

describe("maxCumulativeDrawdown — a correção da equação de §33", () => {
  /**
   * O caso que motivou a correção. Somar déficits mensais já pisados em zero
   * pediria 2.000; a necessidade real de caixa é 1.200, porque o superávit do
   * mês 2 financia parte do déficit do mês 3. Reserva é estoque, não fluxo.
   */
  it("superávit de um mês financia déficit de outro", () => {
    const flows = [
      fluxo(0, 1000, 0), // déficit 1.000 → acumulado -1.000
      fluxo(1, 0, 800), // superávit 800 → acumulado -200
      fluxo(2, 1000, 0), // déficit 1.000 → acumulado -1.200
    ];
    const r = maxCumulativeDrawdown(flows);

    expect(r.need.toString()).toBe("1200"); // a soma dos déficits daria 2000
    expect(r.worstMonth).toBe(2);
  });

  it("quando todo mês é deficitário, coincide com a soma — não afrouxa conservadorismo", () => {
    const flows = [fluxo(0, 1000, 0), fluxo(1, 1000, 0), fluxo(2, 1000, 0)];
    expect(maxCumulativeDrawdown(flows).need.toString()).toBe("3000");
  });

  it("cenário que nunca fica negativo não consome reserva", () => {
    const flows = [fluxo(0, 1000, 1500), fluxo(1, 1000, 1500)];
    const r = maxCumulativeDrawdown(flows);
    expect(r.need.toString()).toBe("0");
  });

  it("aponta o mês do pior aperto", () => {
    const flows = [fluxo(0, 500, 0), fluxo(1, 900, 0), fluxo(2, 0, 5000)];
    expect(maxCumulativeDrawdown(flows).worstMonth).toBe(1);
  });

  it("benefício e seguro contam como entrada no mês em que chegam", () => {
    const flows: MonthlyFlow[] = [
      { ...fluxo(0, 1000, 0) },
      { ...fluxo(1, 1000, 0), insuranceCashflow: new Decimal(3000) },
    ];
    // Mês 0: -1000. Mês 1: -1000 +3000 → acumulado +1000. Pior ponto: mês 0.
    const r = maxCumulativeDrawdown(flows);
    expect(r.need.toString()).toBe("1000");
    expect(r.worstMonth).toBe(0);
  });

  it("fluxo vazio devolve zero, não quebra", () => {
    expect(maxCumulativeDrawdown([]).need.toString()).toBe("0");
  });
});

function contexto(overrides: Partial<ScenarioContext> = {}): ScenarioContext {
  return {
    ccm: new Decimal(5000),
    rendaTotal: new Decimal(10000),
    rendaPrincipal: new Decimal(8000),
    correlacaoRenda: 0,
    recoveryCurve: [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    rendaSegundaAtividadeResiliente: new Decimal(0),
    benefitCashflows: [],
    exposicaoAtivoEssencial: new Decimal(0),
    insurancePayout: new Decimal(0),
    insurancePayoutMonth: 0,
    piorQuedaRendaObservada: new Decimal(2000),
    piorAltaDespesaObservada: new Decimal(1500),
    regimePrincipalEstavel: false,
    rendaDependeDeNegocioProprio: false,
    horizonMonths: 12,
    ...overrides,
  };
}

describe("buildScenarios", () => {
  it("produz os 10 cenários (A, B, C×3, D, E, F, G, H)", () => {
    const ids = buildScenarios(contexto()).map((s) => s.id);
    expect(ids).toEqual(["A", "B", "C25", "C50", "C75", "D", "E", "F", "G", "H"]);
  });

  /**
   * Com folga (renda 10.000, custo de crise 5.000), cortes de 25% e 50% ainda
   * deixam superávit e a necessidade é zero nos dois — o piso em zero faz
   * cenários empatarem, e isso é correto, não um defeito.
   */
  it("com folga de renda, cortes pequenos não consomem reserva nenhuma", () => {
    const s = buildScenarios(contexto());
    const need = (id: string) => s.find((x) => x.id === id)!.need;
    expect(need("C25").toString()).toBe("0");
    expect(need("C50").toString()).toBe("0");
    expect(need("C75").greaterThan(0)).toBe(true);
  });

  it("quando o orçamento é apertado, quanto maior a perda maior a necessidade", () => {
    // Custo de crise 9.000 contra renda de 10.000 — qualquer corte já dói.
    const s = buildScenarios(contexto({ ccm: new Decimal(9000) }));
    const need = (id: string) => s.find((x) => x.id === id)!.need;
    expect(need("C50").greaterThan(need("C25"))).toBe(true);
    expect(need("C75").greaterThan(need("C50"))).toBe(true);
    expect(need("B").greaterThan(need("C75"))).toBe(true);
  });

  /**
   * §31 H: "Esse cenário deve ter grande relevância." Combinar perda de renda
   * com despesa extraordinária tem que doer mais que só perder a renda.
   */
  it("o choque combinado é mais severo que a interrupção sozinha", () => {
    const s = buildScenarios(contexto({ exposicaoAtivoEssencial: new Decimal(8000) }));
    const b = s.find((x) => x.id === "B")!;
    const h = s.find((x) => x.id === "H")!;
    expect(h.need.greaterThan(b.need)).toBe(true);
  });

  /**
   * §23 — o cenário é calculado e exibido, mas não domina a recomendação de
   * quem tem renda estável. Um militar não recebe reserva gigante só porque
   * teria dificuldade de recolocação no privado.
   */
  it("interrupção de renda não é material para regime estável", () => {
    const estavel = buildScenarios(contexto({ regimePrincipalEstavel: true }));
    const b = estavel.find((x) => x.id === "B")!;
    expect(b.isMaterial).toBe(false);
    expect(b.need.greaterThan(0)).toBe(true); // continua calculado
  });

  it("queda de faturamento só é material para quem vive de negócio próprio", () => {
    expect(buildScenarios(contexto()).find((s) => s.id === "G")!.isMaterial).toBe(false);
    expect(
      buildScenarios(contexto({ rendaDependeDeNegocioProprio: true })).find((s) => s.id === "G")!.isMaterial,
    ).toBe(true);
  });

  /**
   * §18 — renda de cônjuge na mesma empresa não protege contra o fechamento
   * dela. Correlação alta tem que aumentar a necessidade.
   */
  it("renda familiar correlacionada protege menos", () => {
    const independente = buildScenarios(contexto({ correlacaoRenda: 0 })).find((s) => s.id === "B")!;
    const mesmaEmpresa = buildScenarios(contexto({ correlacaoRenda: 1 })).find((s) => s.id === "B")!;
    expect(mesmaEmpresa.need.greaterThan(independente.need)).toBe(true);
  });

  it("segunda atividade resiliente reduz a necessidade", () => {
    const sem = buildScenarios(contexto()).find((s) => s.id === "B")!;
    const com = buildScenarios(contexto({ rendaSegundaAtividadeResiliente: new Decimal(2000) })).find(
      (s) => s.id === "B",
    )!;
    expect(com.need.lessThan(sem.need)).toBe(true);
  });

  it("recuperação rápida reduz a necessidade", () => {
    const lenta = buildScenarios(contexto({ recoveryCurve: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1] }));
    const rapida = buildScenarios(contexto({ recoveryCurve: [0, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] }));
    const need = (s: ReturnType<typeof buildScenarios>) => s.find((x) => x.id === "B")!.need;
    expect(need(rapida).lessThan(need(lenta))).toBe(true);
  });

  /**
   * §26/§33 — o momento importa: uma indenização que só chega depois não paga
   * a conta de hoje.
   */
  it("indenização tardia protege menos que indenização imediata", () => {
    const base = { exposicaoAtivoEssencial: new Decimal(20000), insurancePayout: new Decimal(18000) };
    const cedo = buildScenarios(contexto({ ...base, insurancePayoutMonth: 0 })).find((s) => s.id === "E")!;
    const tarde = buildScenarios(contexto({ ...base, insurancePayoutMonth: 6 })).find((s) => s.id === "E")!;
    expect(tarde.need.greaterThan(cedo.need)).toBe(true);
  });

  /**
   * O desembolso imediato vive dentro do fluxo do mês 0. Quem tem folga de
   * renda absorve parte dele com o próprio superávit — por isso a necessidade
   * pode ser menor que a franquia, e isso é o comportamento correto. Quem não
   * tem folga sente o valor cheio.
   */
  it("o desembolso imediato consome reserva quando a renda não o absorve", () => {
    const apertado = buildScenarios(
      contexto({
        ccm: new Decimal(9000),
        exposicaoAtivoEssencial: new Decimal(5000),
        insurancePayout: new Decimal(5000),
        insurancePayoutMonth: 3,
      }),
    ).find((x) => x.id === "E")!;

    expect(apertado.immediateOutOfPocket.toString()).toBe("5000");
    // Renda 10.000 − custo 9.000 − franquia 5.000 = −4.000 no mês do evento.
    expect(apertado.need.toString()).toBe("4000");
  });

  it("com folga de renda, o superávit do próprio mês absorve a franquia", () => {
    const folgado = buildScenarios(
      contexto({ exposicaoAtivoEssencial: new Decimal(5000), insurancePayoutMonth: 3 }),
    ).find((x) => x.id === "E")!;

    // Renda 10.000 − custo 5.000 − franquia 5.000 = 0. Não consome reserva.
    expect(folgado.need.toString()).toBe("0");
    expect(folgado.immediateOutOfPocket.toString()).toBe("5000"); // mas continua visível
  });

  it("benefício entra no mês em que estará disponível", () => {
    const semBeneficio = buildScenarios(contexto()).find((s) => s.id === "B")!;
    const comBeneficio = buildScenarios(
      contexto({
        benefitCashflows: [
          { kind: "SEGURO_DESEMPREGO", startMonth: 1, durationMonths: 5, monthlyAmount: new Decimal(2000) },
        ],
      }),
    ).find((s) => s.id === "B")!;
    expect(comBeneficio.need.lessThan(semBeneficio.need)).toBe(true);
  });
});

describe("piorCenarioMaterial", () => {
  it("escolhe o mais severo entre os materiais, ignorando os não materiais", () => {
    const s = buildScenarios(contexto({ regimePrincipalEstavel: true, exposicaoAtivoEssencial: new Decimal(3000) }));
    const pior = piorCenarioMaterial(s)!;
    expect(pior.isMaterial).toBe(true);
    expect(pior.id).not.toBe("B"); // B não é material para regime estável
  });

  it("devolve null quando nada é material", () => {
    expect(piorCenarioMaterial([])).toBeNull();
  });
});

describe("coberturaNoCenario", () => {
  it("diz por quantos meses a reserva atual sustenta a família naquele cenário", () => {
    const cenario = buildScenarios(contexto())[1]; // B — interrupção
    const semReserva = coberturaNoCenario(new Decimal(0), cenario);
    const comReserva = coberturaNoCenario(new Decimal(50000), cenario);
    expect(comReserva).toBeGreaterThan(semReserva);
  });

  it("reserva que aguenta o cenário inteiro devolve o horizonte completo", () => {
    const cenario = buildScenarios(contexto())[1];
    expect(coberturaNoCenario(new Decimal(999999), cenario)).toBe(cenario.flows.length);
  });
});
