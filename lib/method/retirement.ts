import { Decimal } from "@/lib/finance/types";

/**
 * Etapa 13 — motor de projeção de longo prazo (PLA, §5). Puro.
 *
 * **Trabalha em termos reais**, ou seja, em poder de compra de hoje. É a
 * decisão que mais afeta a leitura dos números: projetar a renda desejada
 * corrigida pela inflação e depois descontá-la pela mesma inflação produz o
 * mesmo resultado com duas chances a mais de errar, e devolve ao cliente um
 * "você precisa de R$ 8 milhões" que ele não sabe interpretar. Aqui, um capital
 * necessário de R$ 2 milhões significa dois milhões **de hoje**.
 *
 * Por isso não há campo de inflação no cálculo: ela já está descontada dentro
 * da taxa real. Misturar as duas seria contá-la duas vezes.
 */

export type ScenarioName = "conservador" | "base" | "otimista";

export const SCENARIOS: ScenarioName[] = ["conservador", "base", "otimista"];

/**
 * Taxa **real** anual (acima da inflação) por cenário.
 *
 * **Estes três números não vêm da Metodologia — ela não os fixa.** São ponto de
 * partida escolhido para o mercado brasileiro e ficam editáveis na tela: cada
 * projeção grava a premissa que a produziu em `assumptions`, então mudar o
 * padrão aqui nunca reescreve o que já foi entregue a um cliente.
 *
 * Estão isolados numa constante nomeada justamente para que discordar deles
 * seja uma conversa sobre o número, e não uma arqueologia dentro da fórmula.
 */
export const TAXA_REAL_PADRAO: Record<ScenarioName, number> = {
  conservador: 0.02,
  base: 0.04,
  otimista: 0.06,
};

/**
 * Idade até a qual o dinheiro precisa durar. **Também não vem da Metodologia.**
 * 90 anos é horizonte de planejamento conservador — bem acima da expectativa de
 * vida média, de propósito: o risco que se está tratando aqui é o de **viver
 * mais** que o dinheiro, e planejar pela média deixaria metade das pessoas
 * descobertas.
 */
export const IDADE_FINAL_PADRAO = 90;

export interface Assumptions {
  /** Taxa real anual, em fração (0.04 = 4% acima da inflação). */
  taxaRealAnual: number;
  /** Até que idade o capital precisa durar. */
  idadeFinal: number;
  /**
   * Renda mensal que já existirá na aposentadoria e **não** precisa vir do
   * capital acumulado — INSS, previdência do empregador, aluguel. Em valores de
   * hoje. É o "fontes já existentes" do §5.
   */
  rendaJaExistenteMensal: string;
}

export interface ProjectionInput {
  idadeAtual: number;
  idadeAlvo: number;
  /** Quanto o cliente quer receber por mês, em poder de compra de hoje. */
  rendaDesejadaMensal: Decimal;
  /** Patrimônio já acumulado e destinado à aposentadoria. */
  capitalAtual: Decimal;
  /** Quanto ele consegue aportar por mês hoje. */
  aporteMensalAtual: Decimal;
}

export interface ProjectionResult {
  scenario: ScenarioName;
  assumptions: Assumptions;
  /** Renda que o capital precisa produzir, já descontadas as fontes existentes. */
  rendaACobrirMensal: Decimal;
  /** Capital necessário na data da aposentadoria, em valores de hoje. */
  requiredCapital: Decimal;
  /** Aporte mensal necessário para chegar lá, dado o que já existe. */
  requiredMonthlyContribution: Decimal;
  /** Quanto o aporte atual representa do necessário — alimenta o PSF (0–100). */
  suficienciaPct: number;
  /** Anos de acumulação restantes. */
  anosAteAlvo: number;
  /** Anos que o capital precisa sustentar. */
  anosDeRenda: number;
  /** Avisos sobre premissa impossível ou dado incoerente — nunca silenciosos. */
  alertas: string[];
}

const ZERO = new Decimal(0);

function taxaMensal(taxaAnual: number): number {
  // Equivalente composta, não divisão por 12: dividir superestima o efeito dos
  // juros em prazos longos, que é exatamente onde este motor opera.
  return Math.pow(1 + taxaAnual, 1 / 12) - 1;
}

/**
 * Capital necessário para pagar `renda` por mês durante `meses`, rendendo
 * `taxaAnual` real — valor presente de uma série de saques.
 *
 * Com taxa zero é a soma simples: sem rendimento, o capital é exatamente o que
 * será sacado. Tratar isso como caso à parte evita divisão por zero e mantém o
 * resultado honesto em vez de infinito.
 */
export function capitalParaRenda(renda: Decimal, meses: number, taxaAnual: number): Decimal {
  if (meses <= 0 || renda.lessThanOrEqualTo(0)) return ZERO;

  const i = taxaMensal(taxaAnual);
  if (i <= 0) return renda.times(meses);

  const fator = (1 - Math.pow(1 + i, -meses)) / i;
  return renda.times(fator);
}

/**
 * Aporte mensal necessário para sair de `capitalAtual` e chegar a `objetivo` em
 * `meses`, rendendo `taxaAnual` real.
 *
 * Devolve zero quando o capital atual, sozinho, já alcança o objetivo — e não
 * um número negativo, que leria como "pode sacar".
 */
export function aporteNecessario(
  objetivo: Decimal,
  capitalAtual: Decimal,
  meses: number,
  taxaAnual: number,
): Decimal {
  if (meses <= 0) return ZERO;

  const i = taxaMensal(taxaAnual);
  const crescimento = Math.pow(1 + i, meses);
  const capitalFuturo = capitalAtual.times(crescimento);
  const falta = objetivo.minus(capitalFuturo);
  if (falta.lessThanOrEqualTo(0)) return ZERO;

  // Fator de acumulação de uma série mensal. Com taxa zero, é o próprio número
  // de meses.
  const fator = i <= 0 ? meses : (crescimento - 1) / i;
  return falta.dividedBy(fator);
}

export function projectScenario(
  input: ProjectionInput,
  scenario: ScenarioName,
  assumptions: Assumptions,
): ProjectionResult {
  const alertas: string[] = [];

  const anosAteAlvo = Math.max(0, input.idadeAlvo - input.idadeAtual);
  const anosDeRenda = Math.max(0, assumptions.idadeFinal - input.idadeAlvo);

  if (input.idadeAlvo <= input.idadeAtual) {
    alertas.push("A idade-alvo não é maior que a idade atual — não há tempo de acumulação nesta projeção.");
  }
  if (anosDeRenda <= 0) {
    alertas.push("A idade final não é maior que a idade-alvo — a projeção não tem período de renda a cobrir.");
  }

  const jaExistente = new Decimal(assumptions.rendaJaExistenteMensal || "0");
  const bruta = input.rendaDesejadaMensal.minus(jaExistente);
  const rendaACobrirMensal = bruta.isNegative() ? ZERO : bruta;

  if (rendaACobrirMensal.lessThanOrEqualTo(0) && input.rendaDesejadaMensal.greaterThan(0)) {
    alertas.push("As fontes já existentes cobrem a renda desejada — nesta premissa não é preciso acumular capital.");
  }

  const requiredCapital = capitalParaRenda(rendaACobrirMensal, anosDeRenda * 12, assumptions.taxaRealAnual);
  const requiredMonthlyContribution = aporteNecessario(
    requiredCapital,
    input.capitalAtual,
    anosAteAlvo * 12,
    assumptions.taxaRealAnual,
  );

  // §5.3.1 — o indicador Longevidade do PSF é aporte atual ÷ aporte necessário.
  // Necessário zero significa objetivo já alcançado, e aí a suficiência é 100 —
  // não uma divisão por zero.
  const suficienciaPct = requiredMonthlyContribution.lessThanOrEqualTo(0)
    ? 100
    : Math.min(100, input.aporteMensalAtual.dividedBy(requiredMonthlyContribution).times(100).toNumber());

  return {
    scenario,
    assumptions,
    rendaACobrirMensal,
    requiredCapital,
    requiredMonthlyContribution,
    suficienciaPct: Number.isFinite(suficienciaPct) ? Math.max(0, suficienciaPct) : 0,
    anosAteAlvo,
    anosDeRenda,
    alertas,
  };
}

/** Os três cenários de uma vez, que é como o PLA é apresentado (§5). */
export function projectAll(
  input: ProjectionInput,
  base: Omit<Assumptions, "taxaRealAnual">,
  taxas: Record<ScenarioName, number> = TAXA_REAL_PADRAO,
): ProjectionResult[] {
  return SCENARIOS.map((s) => projectScenario(input, s, { ...base, taxaRealAnual: taxas[s] }));
}

/**
 * §12.1 — a próxima versão de um cenário. Mesma regra dos entregáveis: nunca
 * reaproveita número, mesmo com buraco na sequência.
 */
export function nextVersion(existentes: number[]): number {
  return existentes.length === 0 ? 0 : Math.max(...existentes) + 1;
}
