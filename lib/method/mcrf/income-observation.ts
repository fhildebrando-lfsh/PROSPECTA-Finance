import { Decimal, type EntryStatus } from "@/lib/finance/types";
import { monthRange, isWithin } from "@/lib/finance/dates";
import { SETTLED_STATUSES } from "@/lib/finance/derived";
import { OBSERVATION_MONTHS_MINIMUM, OBSERVATION_MONTHS_PREFERRED, type ConfiancaAnalise } from "./config";

/**
 * §14/§15 da especificação PROSPECTA-MCRF — motor de renda, camada de
 * **observação**. Puro: recebe lançamentos já buscados, nunca toca no Prisma.
 *
 * Princípio que governa este arquivo (§15): *não depender da resposta "minha
 * renda é variável"*. O extrato já sabe. O que a pessoa declara sobre vínculo,
 * empregador e segunda atividade (`IncomeSource`, `Person`) é o que o extrato
 * **não** revela — quanto e quando entrou, mede-se aqui.
 *
 * Usa **mediana**, não média (§11.4): um 13º ou uma rescisão distorcem a média
 * e fariam o motor superestimar a renda que continuaria existindo num cenário
 * adverso — exatamente o erro que torna uma reserva insuficiente.
 */
export interface IncomeObservationEntry {
  /** `Entry.responsibleId` — a atribuição por pessoa que o sistema já faz desde a Fase 0. */
  responsibleId: string;
  amount: Decimal;
  dueDate: Date;
  status: EntryStatus;
  /** Só RECEITA entra; o chamador pode passar tudo que a filtragem acontece aqui. */
  nature: string;
}

export interface IncomeObservation {
  personId: string;
  /** Mediana das entradas mensais nos meses observados. */
  median: Decimal;
  /** Pior mês observado — §15 pede percentis inferiores; com poucos meses, o mínimo é o percentil honesto. */
  worstMonth: Decimal;
  /** Quantos dos meses observados não tiveram renda nenhuma. Sinal forte de intermitência. */
  monthsWithoutIncome: number;
  monthsObserved: number;
  /** Amplitude relativa: (maior − menor) ÷ mediana. Zero quando a renda é constante. */
  variability: number | null;
  confidence: ConfiancaAnalise;
}

function median(values: Decimal[]): Decimal {
  if (values.length === 0) return new Decimal(0);
  const sorted = [...values].sort((a, b) => a.comparedTo(b));
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return sorted[middle - 1].plus(sorted[middle]).div(2);
}

/**
 * §9 — a confiança cai com a falta de histórico, e cai de novo quando a renda
 * é intermitente: 12 meses em que metade não teve renda não é uma observação
 * forte, é um padrão que precisa de mais evidência.
 */
function confidenceFor(monthsObserved: number, monthsWithoutIncome: number): ConfiancaAnalise {
  const gapRatio = monthsObserved === 0 ? 1 : monthsWithoutIncome / monthsObserved;
  if (monthsObserved >= OBSERVATION_MONTHS_PREFERRED) return gapRatio > 0.25 ? "MODERADA" : "MUITO_ALTA";
  if (monthsObserved >= OBSERVATION_MONTHS_MINIMUM) return gapRatio > 0.25 ? "BAIXA" : "ALTA";
  if (monthsObserved >= 3) return "BAIXA";
  return "BAIXA";
}

/**
 * Renda observada por pessoa. `monthsBack` conta meses **fechados** — o mês
 * corrente fica de fora porque ainda está em curso e entraria como queda
 * artificial de renda (mesma convenção de `lib/finance/reserve.ts`).
 */
export function observeIncomeByPerson(
  entries: IncomeObservationEntry[],
  personIds: string[],
  referenceDate: Date,
  monthsBack: number = OBSERVATION_MONTHS_PREFERRED,
): IncomeObservation[] {
  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();

  const periods = Array.from({ length: Math.max(0, monthsBack) }, (_, i) => monthRange(refYear, refMonth - (i + 1)));

  const settledIncome = entries.filter((e) => e.nature === "RECEITA" && SETTLED_STATUSES.has(e.status));

  return personIds.map((personId) => {
    const mine = settledIncome.filter((e) => e.responsibleId === personId);

    const monthly = periods.map((p) =>
      mine.filter((e) => isWithin(e.dueDate, p.start, p.end)).reduce((sum, e) => sum.plus(e.amount), new Decimal(0)),
    );

    const monthsObserved = monthly.length;
    const monthsWithoutIncome = monthly.filter((v) => v.lessThanOrEqualTo(0)).length;
    const med = median(monthly);

    let variability: number | null = null;
    if (monthsObserved > 0 && med.greaterThan(0)) {
      const sorted = [...monthly].sort((a, b) => a.comparedTo(b));
      variability = sorted[sorted.length - 1].minus(sorted[0]).div(med).toNumber();
    }

    const worstMonth = monthsObserved === 0 ? new Decimal(0) : monthly.reduce((min, v) => (v.lessThan(min) ? v : min));

    return {
      personId,
      median: med,
      worstMonth,
      monthsWithoutIncome,
      monthsObserved,
      variability,
      confidence: confidenceFor(monthsObserved, monthsWithoutIncome),
    };
  });
}

/**
 * §17 — HHI da concentração da renda familiar. Devolve entre 0 e 1: uma única
 * fonte dá 1, duas iguais dão 0,5.
 *
 * **Só diagnóstico, nunca multiplicador da reserva** (§17 fim, e decisão de
 * arquitetura registrada na análise da Etapa 9-A): quem ajusta a reserva é a
 * correlação aplicada dentro de cada cenário. Usar os dois para penalizar
 * seria contar a mesma vulnerabilidade duas vezes.
 */
export function incomeConcentrationHHI(incomes: Decimal[]): number | null {
  const positive = incomes.filter((v) => v.greaterThan(0));
  const total = positive.reduce((sum, v) => sum.plus(v), new Decimal(0));
  if (total.lessThanOrEqualTo(0)) return null;
  return positive.reduce((acc, v) => {
    const share = v.div(total).toNumber();
    return acc + share * share;
  }, 0);
}
