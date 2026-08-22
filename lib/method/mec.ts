import { Decimal } from "@/lib/finance/types";

/**
 * Etapa 11 — Mapa de Endividamento e Crédito (§10, Fase 3). Puro.
 *
 * A razão de existir separado de `lib/finance/open-installments.ts`: aquele
 * módulo sabe **quanto falta pagar**, porque foi desenhado para acompanhar
 * parcelas de `Entry`. Não sabe quem é o credor, quanto a dívida custa, nem se
 * há negativação — e ordenar por saldo, que é o que o dado de parcela permite,
 * leva a quitar a maior em vez da mais cara.
 */

export type DebtStatus = "EM_DIA" | "NEGATIVADO" | "RENEGOCIADO" | "QUITADO";

export interface DebtInput {
  id: string;
  creditorName: string;
  modality: string;
  outstandingBalance: Decimal;
  cetAnnualPercent: Decimal | null;
  hasNegativacao: boolean;
  hasLegalAction: boolean;
  status: DebtStatus;
}

/**
 * §9.6/§10 — modalidades que a Metodologia nomeia como tóxicas por natureza,
 * independentemente do custo declarado. São também as duas que normalmente não
 * existem como parcelamento, e por isso escapariam de qualquer análise baseada
 * só em `Entry`.
 */
export const MODALIDADES_TOXICAS = ["Rotativo do cartão", "Cheque especial"];

/**
 * §9.6 cita "juros compostos em patamares de três dígitos ao ano". Cem por
 * cento é o piso literal dos três dígitos — não é número inventado, e está
 * isolado numa constante para quem discordar poder discutir o valor sem
 * procurar dentro da lógica.
 */
export const CET_TOXICO_PCT = 100;

export interface ToxicVerdict {
  isToxic: boolean;
  /** Por que foi classificada assim — a tela mostra, nunca só o rótulo. */
  motivos: string[];
}

export function classifyToxic(debt: Pick<DebtInput, "modality" | "cetAnnualPercent">): ToxicVerdict {
  const motivos: string[] = [];

  if (MODALIDADES_TOXICAS.includes(debt.modality)) {
    motivos.push(`${debt.modality} é uma das modalidades mais caras do mercado.`);
  }
  if (debt.cetAnnualPercent && debt.cetAnnualPercent.greaterThanOrEqualTo(CET_TOXICO_PCT)) {
    motivos.push(`Custo de ${debt.cetAnnualPercent.toFixed(0)}% ao ano — três dígitos.`);
  }

  return { isToxic: motivos.length > 0, motivos };
}

/** Dívida ainda viva. Quitada sai do mapa, mas não do histórico. */
export function isAberta(d: Pick<DebtInput, "status">): boolean {
  return d.status !== "QUITADO";
}

export interface RankedDebt extends DebtInput {
  toxic: ToxicVerdict;
  /** Posição na ordem de quitação, começando em 1. */
  ordem: number;
}

/**
 * §10 — a ordem de quitação é por **custo**, não por saldo.
 *
 * Critério, em cascata: tóxica primeiro; depois maior CET; depois maior saldo.
 * Dívida sem CET informado vai para o fim entre as não-tóxicas, e **não** é
 * tratada como custo zero: ausência de dado não é notícia boa, e ordená-la à
 * frente sugeriria que é barata. A tela pede o número.
 *
 * O empate final por saldo existe para a ordem ser determinística — duas
 * dívidas idênticas em custo não podem trocar de posição a cada carregamento.
 */
export function rankByCost(debts: DebtInput[]): RankedDebt[] {
  const abertas = debts.filter(isAberta);

  const comVeredito = abertas.map((d) => ({ ...d, toxic: classifyToxic(d) }));

  comVeredito.sort((a, b) => {
    if (a.toxic.isToxic !== b.toxic.isToxic) return a.toxic.isToxic ? -1 : 1;

    const cetA = a.cetAnnualPercent;
    const cetB = b.cetAnnualPercent;
    if (cetA && cetB && !cetA.equals(cetB)) return cetB.comparedTo(cetA);
    if (cetA && !cetB) return -1;
    if (!cetA && cetB) return 1;

    return b.outstandingBalance.comparedTo(a.outstandingBalance);
  });

  return comVeredito.map((d, i) => ({ ...d, ordem: i + 1 }));
}

export interface MecSummary {
  totalEmAberto: Decimal;
  totalToxico: Decimal;
  quantidade: number;
  quantidadeToxica: number;
  temNegativacao: boolean;
  temAcaoJudicial: boolean;
  /** Dívidas sem CET — o que impede o mapa de ordenar direito. */
  semCet: number;
}

export function summarize(ranked: RankedDebt[]): MecSummary {
  const zero = new Decimal(0);
  return {
    totalEmAberto: ranked.reduce((s, d) => s.plus(d.outstandingBalance), zero),
    totalToxico: ranked.filter((d) => d.toxic.isToxic).reduce((s, d) => s.plus(d.outstandingBalance), zero),
    quantidade: ranked.length,
    quantidadeToxica: ranked.filter((d) => d.toxic.isToxic).length,
    temNegativacao: ranked.some((d) => d.hasNegativacao),
    temAcaoJudicial: ranked.some((d) => d.hasLegalAction),
    semCet: ranked.filter((d) => d.cetAnnualPercent === null).length,
  };
}

/**
 * O que o mapa recomenda, em frases. Nunca é "pague isto": §3.1 da Metodologia
 * separa diagnóstico de recomendação de produto, e renegociação é decisão do
 * cliente com o credor dele.
 */
export function orientacoes(ranked: RankedDebt[], resumo: MecSummary): string[] {
  const out: string[] = [];

  if (ranked.length === 0) return ["Nenhuma dívida em aberto registrada."];

  const primeira = ranked[0];
  out.push(
    `Comece por ${primeira.creditorName} (${primeira.modality}) — é a de maior custo, e é onde cada real amortizado rende mais.`,
  );

  if (resumo.quantidadeToxica > 0) {
    out.push(
      `${resumo.quantidadeToxica} dívida(s) em modalidade cara ou com juros de três dígitos ao ano. Trocar essas por uma linha mais barata costuma valer mais que qualquer corte de despesa.`,
    );
  }
  if (resumo.temNegativacao) {
    out.push("Há negativação registrada. Regularizar destrava crédito mais barato e costuma ser pré-requisito para renegociar o resto.");
  }
  if (resumo.temAcaoJudicial) {
    out.push("Há ação judicial em curso — esse caso tem prazo próprio e precede a ordem de custo.");
  }
  if (resumo.semCet > 0) {
    out.push(
      `${resumo.semCet} dívida(s) sem o custo informado. Sem o CET, o mapa não consegue dizer qual sai primeiro — é o dado que mais falta.`,
    );
  }

  return out;
}
