import { Decimal } from "@/lib/finance/types";
import { METHODOLOGY_VERSION, type ConfiancaAnalise } from "./config";
import { piorCenarioMaterial, type ScenarioResult } from "./scenario-engine";

/**
 * §34, §35, §37 e §4 da especificação PROSPECTA-MCRF — Piso de Liquidez
 * Imediata, Reserva Recomendada, os três níveis de proteção e o IPRF. Puro.
 *
 * É onde os seis motores anteriores se encontram e um número sai. A ordem
 * importa: a reserva **não** é um múltiplo de despesa que depois recebe ajustes;
 * ela é o maior entre o piso de liquidez e o que os cenários materiais
 * consumiriam, com uma margem que cresce quando o dado é ruim.
 */

/**
 * §34 — mesmo quem é extremamente estável precisa de liquidez de curto prazo.
 * Nunca um valor nacional fixo: sai do custo de contingência da própria pessoa,
 * somado ao pior desembolso imediato que ela plausivelmente enfrentaria.
 *
 * Três meses de CCM é o horizonte mínimo de reação — tempo de perceber o
 * problema, decidir e agir sem vender nada às pressas.
 */
export function pisoLiquidezImediata(ccm: Decimal, maiorFranquiaOuDesembolso: Decimal): Decimal {
  const tresMeses = ccm.times(3);
  const comDesembolso = ccm.plus(maiorFranquiaOuDesembolso);
  return tresMeses.greaterThan(comDesembolso) ? tresMeses : comDesembolso;
}

export interface MargemInput {
  confiancaDespesa: ConfiancaAnalise;
  confiancaRenda: ConfiancaAnalise;
  /** §35 — seguro declarado mas não confirmado aumenta a incerteza. */
  temSeguroNaoConfirmado: boolean;
  /** §35 — benefício marcado "a confirmar" também. */
  temBeneficioIncerto: boolean;
  /** Renda muito volátil exige folga adicional (§15). */
  rendaAltamenteVolatil: boolean;
}

const PESO_CONFIANCA: Record<ConfiancaAnalise, number> = {
  MUITO_ALTA: 0,
  ALTA: 0.03,
  MODERADA: 0.07,
  BAIXA: 0.12,
};

/**
 * §35 — Margem de Incerteza do Modelo. Cresce quando falta dado, quando o
 * histórico é curto, quando a informação crítica é apenas declarada.
 *
 * A margem é **honestidade, não conservadorismo gratuito**: ela existe para o
 * número não fingir precisão que os dados não sustentam (§9). Quem preenche
 * mais o perfil recebe uma recomendação menor — e é assim que deve ser.
 */
export function margemIncerteza(input: MargemInput): number {
  let margem = PESO_CONFIANCA[input.confiancaDespesa] + PESO_CONFIANCA[input.confiancaRenda];
  if (input.temSeguroNaoConfirmado) margem += 0.05;
  if (input.temBeneficioIncerto) margem += 0.05;
  if (input.rendaAltamenteVolatil) margem += 0.05;
  // Teto: acima disso a margem viraria o cálculo, e o resultado deixaria de ser
  // derivado dos cenários para ser derivado da própria ignorância.
  return Math.min(margem, 0.35);
}

export interface ReserveRecommendation {
  methodologyVersion: string;
  /** §37 — cobertura mínima para choques comuns de curto prazo. */
  protecaoEssencial: Decimal;
  /** §37 — o resultado principal do MCRF. É o número que a tela destaca. */
  protecaoRecomendada: Decimal;
  /** §37 — margem elevada, para quem quer folga adicional. */
  protecaoReforcada: Decimal;
  /** Cenário que determinou a recomendação — o "por que este valor" (§41). */
  cenarioDeterminante: ScenarioResult | null;
  margemAplicada: number;
  /** O que a pessoa tem hoje, já ponderado pela elegibilidade (§30). */
  reservaAtualElegivel: Decimal;
  /** 0–100. Quanto da recomendação já está construído. */
  progressoPct: number;
  /** Quanto ainda falta. Zero quando a meta já foi atingida ou superada. */
  faltaConstruir: Decimal;
}

/**
 * §35 — a equação principal, com a divergência 5 da análise já resolvida.
 *
 * A especificação define `max(PLI, cenários materiais)` e depois fala em
 * Proteção Reforçada como "cenário combinado **ou** margem adicional". Se o
 * cenário H (combinado) já estivesse no `max()`, Reforçada e Recomendada
 * seriam o mesmo número e o terceiro nível sumiria; se ficasse de fora, o
 * cenário que §31 chama de "grande relevância" não entraria no resultado
 * principal.
 *
 * Resolução adotada: **H entra no `max()` da Recomendada** (como §31 exige) e a
 * Reforçada se distingue por margem elevada, não por cenário extra.
 */
export function recommendReserve(input: {
  pli: Decimal;
  scenarios: ScenarioResult[];
  margem: number;
  reservaAtualElegivel: Decimal;
}): ReserveRecommendation {
  const determinante = piorCenarioMaterial(input.scenarios);
  const necessidadeCenario = determinante?.need ?? new Decimal(0);

  const base = necessidadeCenario.greaterThan(input.pli) ? necessidadeCenario : input.pli;
  const recomendada = base.times(1 + input.margem);
  // Reforçada = margem dobrada, com teto — é folga adicional consciente, não
  // um cenário diferente.
  const reforcada = base.times(1 + Math.min(input.margem * 2 + 0.1, 0.6));

  const progresso = recomendada.lessThanOrEqualTo(0)
    ? 100
    : Math.min(100, input.reservaAtualElegivel.div(recomendada).times(100).toNumber());

  const falta = recomendada.minus(input.reservaAtualElegivel);

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    protecaoEssencial: input.pli,
    protecaoRecomendada: recomendada,
    protecaoReforcada: reforcada,
    cenarioDeterminante: determinante,
    margemAplicada: input.margem,
    reservaAtualElegivel: input.reservaAtualElegivel,
    progressoPct: Math.max(0, progresso),
    faltaConstruir: falta.isNegative() ? new Decimal(0) : falta,
  };
}

export interface IprfInput {
  /** Cobertura da reserva sobre a recomendação, 0–1. */
  adequacaoLiquidez: number;
  /** 0–1 — quanto da renda sobreviveria ao pior cenário material. */
  continuidadeRenda: number;
  /** §17 — HHI, 0–1. Quanto maior, mais concentrada (pior). */
  concentracaoRenda: number | null;
  /** §28 — rigidez financeira em %, quanto da renda está presa. */
  rigidezPct: number | null;
  /** 0–100 — IPP do motor profissional. */
  ipp: number;
  /** §26 — fração dos riscos materiais com alguma proteção contratada, 0–1. */
  coberturaSeguros: number;
}

export interface IprfResult {
  /** 0–100. Quanto maior, mais resiliente. */
  score: number;
  componentes: { nome: string; valor: number; peso: number }[];
}

/**
 * §4 — Índice PROSPECTA de Resiliência Financeira.
 *
 * **Não é multiplicador da reserva** (§4 explicita: "o IPRF deve ser
 * consequência da análise, não o mecanismo principal que determina a reserva").
 * Ele é diagnóstico e comunicação.
 *
 * Decisão de arquitetura registrada na análise (divergência 3): o IPRF **não
 * vira um segundo score de capa** ao lado do PSF que já existe em produção —
 * ele alimenta os indicadores de Liquidez e Proteção do PSF e aparece
 * decomposto aqui dentro. Dois números de "saúde financeira" divergentes na
 * mesma tela não teriam autoridade nenhum dos dois.
 */
export function computeIprf(input: IprfInput): IprfResult {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  // Concentração e rigidez são invertidas: quanto maiores, pior a resiliência.
  const diversificacao = input.concentracaoRenda === null ? 0.5 : clamp01(1 - input.concentracaoRenda);
  const flexibilidade = input.rigidezPct === null ? 0.5 : clamp01(1 - input.rigidezPct / 100);

  const componentes = [
    { nome: "Adequação da liquidez", valor: clamp01(input.adequacaoLiquidez), peso: 30 },
    { nome: "Continuidade da renda", valor: clamp01(input.continuidadeRenda), peso: 20 },
    { nome: "Diversificação das fontes", valor: diversificacao, peso: 15 },
    { nome: "Flexibilidade das despesas", valor: flexibilidade, peso: 15 },
    { nome: "Capacidade de recuperação", valor: clamp01(input.ipp / 100), peso: 10 },
    { nome: "Cobertura de seguros", valor: clamp01(input.coberturaSeguros), peso: 10 },
  ];

  const score = componentes.reduce((sum, c) => sum + c.valor * c.peso, 0);
  return { score: Math.round(score), componentes };
}

/**
 * §41 — os 3 a 5 fatores que mais explicam o valor, em linguagem de gente.
 * Ordenados por impacto, porque a tela mostra só os primeiros.
 */
export function principaisFatores(
  rec: ReserveRecommendation,
  iprf: IprfResult,
  extras: { correlacaoAlta: boolean; semSegundaAtividade: boolean; semSeguro: boolean },
): string[] {
  const fatores: string[] = [];

  if (rec.cenarioDeterminante) {
    fatores.push(`O cenário que mais pesa é "${rec.cenarioDeterminante.label}".`);
  }
  if (extras.correlacaoAlta) {
    fatores.push("As rendas da família dependem da mesma fonte — uma não protege a outra.");
  }
  if (extras.semSegundaAtividade) {
    fatores.push("Não há atividade alternativa capaz de repor renda rapidamente.");
  }
  if (extras.semSeguro) {
    fatores.push("Riscos relevantes estão sem cobertura contratada, e a reserva acaba tendo que cobri-los.");
  }
  if (rec.margemAplicada >= 0.15) {
    fatores.push("Faltam dados no seu perfil, então a recomendação inclui uma margem de segurança maior.");
  }

  const pior = [...iprf.componentes].sort((a, b) => a.valor - b.valor)[0];
  if (pior && pior.valor < 0.5) fatores.push(`Seu ponto mais frágil hoje é: ${pior.nome.toLowerCase()}.`);

  return fatores.slice(0, 5);
}
