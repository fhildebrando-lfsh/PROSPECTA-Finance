import { Decimal } from "@/lib/finance/types";
import { benefitAmountForMonth, type BenefitCashflow } from "./benefits-engine";

/**
 * §31 e §33 da especificação PROSPECTA-MCRF — stress tests e a equação central.
 * Puro: recebe o resultado dos outros motores, nunca busca dado.
 *
 * Este é o núcleo do método. A reserva não sai de "despesa × meses": sai de
 * simular eventos adversos mês a mês e medir quanta liquidez seria consumida
 * até a recuperação.
 *
 * **Correção matemática aplicada — divergência 1 da análise da Etapa 9-A.**
 * §33 define `ScenarioNeed = ImmediateOutOfPocket + Σ max(0, Deficit_t)`. Somar
 * déficits mensais já pisados em zero ignora que superávit de um mês financia
 * déficit de outro, e superestima a reserva. Reserva é **estoque**, não fluxo.
 *
 * Exemplo: déficit 1.000 no mês 1, superávit 800 no mês 2, déficit 1.000 no
 * mês 3. A fórmula original pede 2.000; a necessidade real de caixa é 1.200.
 *
 * Aqui usamos o **pico de saldo acumulado negativo** (máximo drawdown), que é a
 * medida padrão de necessidade de liquidez. Quando todos os meses são
 * deficitários os dois resultados coincidem — a correção nunca reduz
 * conservadorismo, só remove superestimação.
 */
export interface MonthlyFlow {
  month: number;
  /** CCM — o custo de atravessar a crise, já com os cortes razoáveis (§12). */
  essentialOutflow: Decimal;
  /** Despesa extraordinária do cenário (franquia, reparo, despesa médica). */
  extraordinaryOutflow: Decimal;
  /** Renda que sobrevive neste mês deste cenário (§16 — RRC). */
  resilientIncome: Decimal;
  /** Benefício disponível **neste mês** (§25 — respeitado o prazo até cair). */
  availableBenefits: Decimal;
  /** Indenização de seguro que entra **neste mês** (§26 — respeitado o prazo). */
  insuranceCashflow: Decimal;
}

export interface ScenarioResult {
  id: ScenarioId;
  label: string;
  /** Necessidade de liquidez do cenário: gasto imediato + pico de caixa negativo. */
  need: Decimal;
  /** Desembolso que acontece no ato, antes de qualquer entrada compensar. */
  immediateOutOfPocket: Decimal;
  /** Mês em que o caixa acumulado atinge o pior ponto — quando o aperto é máximo. */
  worstMonth: number;
  flows: MonthlyFlow[];
  /** Falso quando o cenário não é materialmente relevante para este perfil (§23). */
  isMaterial: boolean;
  /** Por que este cenário foi (ou não foi) considerado. */
  rationale: string;
}

export type ScenarioId = "A" | "B" | "C25" | "C50" | "C75" | "D" | "E" | "F" | "G" | "H";

/**
 * O coração da correção: pico de saldo acumulado negativo.
 *
 * Percorre o fluxo acumulando entradas menos saídas. O ponto mais negativo do
 * acumulado é a liquidez que precisou existir. Piso em zero: se o acumulado
 * nunca fica negativo, o cenário não consome reserva.
 */
export function maxCumulativeDrawdown(flows: MonthlyFlow[]): { need: Decimal; worstMonth: number } {
  let running = new Decimal(0);
  let worst = new Decimal(0);
  let worstMonth = 0;

  for (const f of flows) {
    const entradas = f.resilientIncome.plus(f.availableBenefits).plus(f.insuranceCashflow);
    const saidas = f.essentialOutflow.plus(f.extraordinaryOutflow);
    running = running.plus(entradas).minus(saidas);

    if (running.lessThan(worst)) {
      worst = running;
      worstMonth = f.month;
    }
  }

  return { need: worst.isNegative() ? worst.abs() : new Decimal(0), worstMonth };
}

export interface ScenarioContext {
  /** Custo de contingência mensal — o que a vida custa durante a crise (§12). */
  ccm: Decimal;
  /** Renda mediana total da unidade financeira, hoje. */
  rendaTotal: Decimal;
  /** A fonte principal, que some no cenário B. */
  rendaPrincipal: Decimal;
  /**
   * §18 — quanto da renda dos demais provedores cai junto com a principal.
   * 0 = independentes; 1 = totalmente correlacionadas (mesma empresa). Sem
   * informação, o chamador deve passar um valor conservador, nunca 0.
   */
  correlacaoRenda: number;
  /** §22 — fração da renda principal recuperada a cada mês. Índice = mês. */
  recoveryCurve: number[];
  /** §21 — renda de segunda atividade que conta como resiliente. */
  rendaSegundaAtividadeResiliente: Decimal;
  benefitCashflows: BenefitCashflow[];
  /** §31 E — desembolso não coberto num evento com ativo essencial (franquia). */
  exposicaoAtivoEssencial: Decimal;
  /** Indenização líquida e o mês em que ela cai (§26). */
  insurancePayout: Decimal;
  insurancePayoutMonth: number;
  /** §31 A — pior variação de renda e de despesa já observada no histórico. */
  piorQuedaRendaObservada: Decimal;
  piorAltaDespesaObservada: Decimal;
  /** Regime do provedor principal — dirige a materialidade do cenário B (§23). */
  regimePrincipalEstavel: boolean;
  /** §31 G — a renda depende de faturamento próprio (autônomo/empresário)? */
  rendaDependeDeNegocioProprio: boolean;
  horizonMonths: number;
}

/** Renda dos demais provedores, já descontada a correlação com a principal. */
function rendaOutrosResiliente(ctx: ScenarioContext): Decimal {
  const outros = ctx.rendaTotal.minus(ctx.rendaPrincipal);
  if (outros.lessThanOrEqualTo(0)) return new Decimal(0);
  const fator = Math.max(0, Math.min(1, 1 - ctx.correlacaoRenda));
  return outros.times(fator);
}

function emptyFlow(month: number, ctx: ScenarioContext): MonthlyFlow {
  return {
    month,
    essentialOutflow: ctx.ccm,
    extraordinaryOutflow: new Decimal(0),
    resilientIncome: new Decimal(0),
    availableBenefits: benefitAmountForMonth(ctx.benefitCashflows, month),
    insuranceCashflow: new Decimal(0),
  };
}

/**
 * §31 B — interrupção da renda principal. Sobrevive a renda dos outros
 * provedores (descontada a correlação), a segunda atividade resiliente e a
 * recuperação progressiva da própria renda principal.
 */
function cenarioInterrupcao(ctx: ScenarioContext, fracaoPerdida: number): MonthlyFlow[] {
  const outros = rendaOutrosResiliente(ctx);

  return Array.from({ length: ctx.horizonMonths + 1 }, (_, month) => {
    const recuperado = ctx.recoveryCurve[Math.min(month, ctx.recoveryCurve.length - 1)] ?? 1;
    const principalRestante = ctx.rendaPrincipal.times(1 - fracaoPerdida);
    const principalRecuperada = ctx.rendaPrincipal.times(fracaoPerdida).times(recuperado);

    return {
      ...emptyFlow(month, ctx),
      resilientIncome: outros
        .plus(ctx.rendaSegundaAtividadeResiliente)
        .plus(principalRestante)
        .plus(principalRecuperada),
    };
  });
}

export function buildScenarios(ctx: ScenarioContext): ScenarioResult[] {
  const zero = new Decimal(0);
  const resultados: ScenarioResult[] = [];

  /**
   * O desembolso imediato entra **dentro** do fluxo, no mês 0, e não somado por
   * fora do drawdown.
   *
   * §33 escreve `ScenarioNeed = ImmediateOutOfPocket + Σ Deficit_t`, tratando os
   * dois como parcelas separadas. Com a soma de déficits isso funcionava; com o
   * pico de saldo acumulado, somar por fora quebra justamente o que a correção
   * veio proteger — o **momento** dos fluxos. Um desembolso somado por fora não
   * interage com a indenização que chega no mês 3, e a franquia paga hoje
   * passaria a doer igual estando o seguro pago amanhã ou daqui a um semestre.
   *
   * Colocando no mês 0, o drawdown mede o buraco real: quanto tempo o dinheiro
   * fica fora antes das entradas o recomporem. `immediateOutOfPocket` continua
   * sendo devolvido para a tela poder mostrar "saiu do bolso na hora", mas não
   * é somado duas vezes.
   */
  const push = (
    id: ScenarioId,
    label: string,
    flows: MonthlyFlow[],
    immediateOutOfPocket: Decimal,
    isMaterial: boolean,
    rationale: string,
  ) => {
    const comDesembolso = immediateOutOfPocket.greaterThan(0)
      ? flows.map((f, i) =>
          i === 0 ? { ...f, extraordinaryOutflow: f.extraordinaryOutflow.plus(immediateOutOfPocket) } : f,
        )
      : flows;

    const { need, worstMonth } = maxCumulativeDrawdown(comDesembolso);
    resultados.push({
      id,
      label,
      need,
      immediateOutOfPocket,
      worstMonth,
      flows: comDesembolso,
      isMaterial,
      rationale,
    });
  };

  // --- A — volatilidade normal severa (§31 A) ---
  // Não é catástrofe: é o pior mês que esta pessoa já viveu, repetido por um
  // trimestre. Serve de piso de realidade, não de cenário extremo.
  const flowsA = Array.from({ length: 3 }, (_, month) => ({
    ...emptyFlow(month, ctx),
    extraordinaryOutflow: ctx.piorAltaDespesaObservada,
    resilientIncome: Decimal.max(zero, ctx.rendaTotal.minus(ctx.piorQuedaRendaObservada)),
  }));
  push("A", "Volatilidade severa dentro do já observado", flowsA, zero, true, "Baseado no seu próprio histórico.");

  // --- B — interrupção da renda principal (§31 B) ---
  // §23: para regime estável (servidor/militar), a interrupção existe mas não é
  // materialmente provável. Continua sendo calculada e exibida — o cliente
  // precisa ver o número —, só não domina a recomendação.
  push(
    "B",
    "Interrupção da renda principal",
    cenarioInterrupcao(ctx, 1),
    zero,
    !ctx.regimePrincipalEstavel,
    ctx.regimePrincipalEstavel
      ? "Sua renda tem alta estabilidade — o cenário é calculado, mas não domina a recomendação."
      : "Perda integral da principal fonte, com recuperação progressiva.",
  );

  // --- C — redução parcial (§31 C) ---
  for (const [id, fracao, rotulo] of [
    ["C25", 0.25, "25%"],
    ["C50", 0.5, "50%"],
    ["C75", 0.75, "75%"],
  ] as const) {
    push(id, `Redução de ${rotulo} da renda principal`, cenarioInterrupcao(ctx, fracao), zero, true, "Queda parcial e recuperação gradual.");
  }

  // --- D — incapacidade temporária (§31 D) ---
  // Renda principal para, benefícios entram no mês em que estarão disponíveis,
  // e há despesa adicional de saúde. Para regime estável este é o risco real.
  const flowsD = cenarioInterrupcao(ctx, 1).map((f) => ({
    ...f,
    extraordinaryOutflow: f.month <= 2 ? ctx.exposicaoAtivoEssencial : zero,
  }));
  push(
    "D",
    "Incapacidade temporária",
    flowsD,
    zero,
    true,
    ctx.regimePrincipalEstavel
      ? "Para quem tem renda estável, este costuma ser o risco mais relevante."
      : "Afastamento com despesa adicional e benefícios respeitando carência.",
  );

  // --- E — emergência com ativo essencial (§31 E) ---
  // §31 E: "Calcular somente a exposição não coberta." O seguro entra no mês em
  // que a indenização realmente cai — não no mês do evento.
  const flowsE = Array.from({ length: ctx.horizonMonths + 1 }, (_, month) => ({
    ...emptyFlow(month, ctx),
    resilientIncome: ctx.rendaTotal,
    insuranceCashflow: month === ctx.insurancePayoutMonth ? ctx.insurancePayout : zero,
  }));
  push(
    "E",
    "Emergência com ativo essencial",
    flowsE,
    ctx.exposicaoAtivoEssencial,
    ctx.exposicaoAtivoEssencial.greaterThan(0),
    "Desembolso imediato; a indenização, quando existe, entra só no mês em que cai.",
  );

  // --- F — emergência familiar (§31 F) ---
  // Despesa temporária somada à redução parcial da capacidade de um provedor.
  const flowsF = cenarioInterrupcao(ctx, 0.3).map((f) => ({
    ...f,
    extraordinaryOutflow: f.month <= 5 ? ctx.ccm.times(0.2) : zero,
  }));
  push("F", "Emergência familiar", flowsF, zero, true, "Cuidado com familiar: despesa sobe e capacidade laboral cai.");

  // --- G — autônomo/empresário (§31 G) ---
  const flowsG = cenarioInterrupcao(ctx, 0.6);
  push(
    "G",
    "Queda prolongada de faturamento",
    flowsG,
    zero,
    ctx.rendaDependeDeNegocioProprio,
    ctx.rendaDependeDeNegocioProprio
      ? "Sua renda depende do próprio negócio — queda de faturamento atinge você direto."
      : "Não se aplica: sua renda não depende de faturamento próprio.",
  );

  // --- H — choque combinado (§31 H) ---
  // §31: "Esse cenário deve ter grande relevância." Entra no `max()` da
  // Recomendada por decisão da análise (divergência 5), e não só na Reforçada.
  const flowsH = cenarioInterrupcao(ctx, 1).map((f) => ({
    ...f,
    extraordinaryOutflow: f.month === 0 ? ctx.exposicaoAtivoEssencial : zero,
  }));
  push(
    "H",
    "Choque combinado: perda de renda + despesa extraordinária",
    flowsH,
    zero,
    true,
    "Os dois ao mesmo tempo — é o que costuma acontecer na vida real.",
  );

  return resultados;
}

/** O cenário mais severo entre os materialmente relevantes (§32). */
export function piorCenarioMaterial(scenarios: ScenarioResult[]): ScenarioResult | null {
  const materiais = scenarios.filter((s) => s.isMaterial);
  if (materiais.length === 0) return null;
  return materiais.reduce((pior, s) => (s.need.greaterThan(pior.need) ? s : pior));
}

/**
 * §38.2 — cobertura no cenário: por quantos meses a reserva atual sustentaria
 * a família naquele cenário. Tem mais relevância analítica que a cobertura
 * matemática (§38.1), porque considera a renda que continua existindo.
 */
export function coberturaNoCenario(reservaAtual: Decimal, scenario: ScenarioResult): number {
  let running = reservaAtual;
  for (const f of scenario.flows) {
    const entradas = f.resilientIncome.plus(f.availableBenefits).plus(f.insuranceCashflow);
    const saidas = f.essentialOutflow.plus(f.extraordinaryOutflow);
    running = running.plus(entradas).minus(saidas);
    if (running.lessThan(0)) return f.month;
  }
  return scenario.flows.length;
}
