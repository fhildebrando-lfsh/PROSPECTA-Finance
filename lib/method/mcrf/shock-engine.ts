import { Decimal } from "@/lib/finance/types";
import type { ShockKind } from "@/app/generated/prisma/enums";

/**
 * §13, §45 e §46 da especificação PROSPECTA-MCRF — aprendizado com choques
 * reais e protocolo de recomposição. Puro.
 *
 * **A regra que governa este arquivo é uma proibição** (§46): *"não implementar
 * aprendizado opaco; toda inferência relevante deverá ser identificável"*.
 *
 * Por isso nenhuma função aqui devolve só um número. Toda vez que o histórico
 * real muda algo no cálculo, ela devolve junto **qual evento causou a mudança**
 * — o cliente precisa conseguir apontar a linha da tela que explica o número.
 * Um modelo estatístico escondido seria mais sofisticado e menos honesto.
 */
export interface ShockRecord {
  id: string;
  kind: ShockKind;
  description: string;
  occurredAt: Date;
  extraordinaryExpense: Decimal | null;
  incomeLossMonthly: Decimal | null;
  durationMonths: number | null;
  hadInsurance: boolean | null;
  reimbursedAmount: Decimal | null;
  paidByUserAmount: Decimal | null;
  daysUntilReimbursement: number | null;
  reserveUsedAmount: Decimal | null;
  recomposedAt: Date | null;
}

export interface ShockLearning {
  /**
   * §34 — o maior desembolso do próprio bolso já observado. Alimenta o Piso de
   * Liquidez Imediata: cenário simulado é hipótese, evento registrado é fato,
   * e fato pesa mais.
   */
  maiorDesembolsoObservado: Decimal;
  /** O evento que produziu esse valor — a inferência identificável de §46. */
  eventoDeterminante: ShockRecord | null;
  /**
   * §26 — prazo mediano real até a indenização cair, medido nos eventos com
   * seguro. Calibra com evidência o `payoutDelayDays` que hoje é declarado.
   * `null` quando não há evento com seguro e prazo registrados.
   */
  prazoRealDeIndenizacaoDias: number | null;
  /** Quantos eventos sustentam cada conclusão — evita conclusão de amostra 1. */
  eventosComDesembolso: number;
  eventosComSeguro: number;
  /** Frases prontas para a tela explicar o que o histórico mudou. */
  explicacoes: string[];
}

/** Quanto saiu do bolso num evento — o que o seguro não cobriu. */
function desembolsoDoBolso(e: ShockRecord): Decimal {
  if (e.paidByUserAmount) return e.paidByUserAmount;
  const bruto = e.extraordinaryExpense ?? new Decimal(0);
  const reembolso = e.reimbursedAmount ?? new Decimal(0);
  const liquido = bruto.minus(reembolso);
  return liquido.isNegative() ? new Decimal(0) : liquido;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * O que o histórico real desta família ensina sobre os números do modelo.
 *
 * Deliberadamente conservador na direção **de cima**: o histórico só é usado
 * para **elevar** pisos, nunca para reduzi-los. Alguém que nunca teve um
 * choque grande não está protegido contra ter o primeiro — ausência de evento
 * não é evidência de segurança (§8).
 */
export function learnFromShocks(events: ShockRecord[]): ShockLearning {
  const explicacoes: string[] = [];

  const comDesembolso = events
    .map((e) => ({ evento: e, valor: desembolsoDoBolso(e) }))
    .filter((x) => x.valor.greaterThan(0));

  const maior = comDesembolso.reduce<{ evento: ShockRecord; valor: Decimal } | null>(
    (max, x) => (max === null || x.valor.greaterThan(max.valor) ? x : max),
    null,
  );

  if (maior) {
    explicacoes.push(
      `Seu maior desembolso já registrado foi de R$ ${maior.valor.toFixed(2)} ("${maior.evento.description}") — ` +
        "seu piso de liquidez considera isso, porque já aconteceu de verdade.",
    );
  }

  const prazos = events
    .filter((e) => e.hadInsurance === true && e.daysUntilReimbursement != null)
    .map((e) => e.daysUntilReimbursement!);
  const prazoMediano = median(prazos);

  if (prazoMediano !== null) {
    explicacoes.push(
      `Nas vezes em que você acionou um seguro, a indenização levou em média ${Math.round(prazoMediano)} dias para cair. ` +
        "Esse é o intervalo que a sua reserva precisa cobrir sozinha.",
    );
  }

  const semSeguro = events.filter((e) => e.hadInsurance === false && desembolsoDoBolso(e).greaterThan(0));
  if (semSeguro.length >= 2) {
    explicacoes.push(
      `${semSeguro.length} dos seus choques aconteceram sem nenhum seguro envolvido — vale avaliar se algum deles seria transferível.`,
    );
  }

  return {
    maiorDesembolsoObservado: maior?.valor ?? new Decimal(0),
    eventoDeterminante: maior?.evento ?? null,
    prazoRealDeIndenizacaoDias: prazoMediano,
    eventosComDesembolso: comDesembolso.length,
    eventosComSeguro: prazos.length,
    explicacoes,
  };
}

export interface RecompositionStatus {
  /** Eventos que consumiram reserva e ainda não foram repostos. */
  pendentes: ShockRecord[];
  /** Quanto ainda falta repor, somando os pendentes. */
  totalAReporr: Decimal;
  /** Quanto já foi consumido da reserva historicamente, reposto ou não. */
  totalJaConsumido: Decimal;
}

/**
 * §45 — protocolo de recomposição. A reserva é "sistema vivo": usar não é
 * fracasso, é a reserva funcionando. O que importa é o sistema saber que ela
 * foi usada e cobrar a reposição.
 */
export function recompositionStatus(events: ShockRecord[]): RecompositionStatus {
  const zero = new Decimal(0);
  const usados = events.filter((e) => e.reserveUsedAmount != null && e.reserveUsedAmount.greaterThan(0));
  const pendentes = usados.filter((e) => e.recomposedAt === null);

  return {
    pendentes,
    totalAReporr: pendentes.reduce((sum, e) => sum.plus(e.reserveUsedAmount!), zero),
    totalJaConsumido: usados.reduce((sum, e) => sum.plus(e.reserveUsedAmount!), zero),
  };
}

/**
 * §45 item 8 — plano de recomposição: em quanto tempo a reserva volta ao nível,
 * dado o aporte mensal que a pessoa consegue fazer.
 *
 * Devolve `null` para o prazo quando não há aporte possível — mesmo tratamento
 * de `plan-engine.ts`: sem capacidade, inventar um prazo seria ficção.
 */
export function recompositionPlan(totalAReporr: Decimal, aporteMensal: Decimal): number | null {
  if (totalAReporr.lessThanOrEqualTo(0)) return 0;
  if (aporteMensal.lessThanOrEqualTo(0)) return null;
  return Math.ceil(totalAReporr.div(aporteMensal).toNumber());
}
