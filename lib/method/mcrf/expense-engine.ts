import { Decimal, type EntryStatus } from "@/lib/finance/types";
import { monthRange, isWithin } from "@/lib/finance/dates";
import { SETTLED_STATUSES } from "@/lib/finance/derived";
import type { Rigidez } from "@/app/generated/prisma/enums";
import {
  CCM_REDUCAO_AJUSTAVEL_PCT_PADRAO,
  OBSERVATION_MONTHS_MINIMUM,
  OBSERVATION_MONTHS_PREFERRED,
  type ConfiancaAnalise,
} from "./config";

/**
 * §11 e §12 da especificação PROSPECTA-MCRF — **CEMA** (Custo Essencial Mensal
 * Ajustado) e **CCM** (Custo de Contingência Mensal). Puro: recebe lançamentos
 * já buscados, nunca toca no Prisma.
 *
 * A diferença entre os dois é o que dimensiona a reserva:
 *
 * - **CEMA** = o que a vida custa por mês, contando só o essencial. É o
 *   baseline.
 * - **CCM** = o que ela custaria **durante uma crise**, depois de cortes
 *   razoáveis. É menor, e é ele que entra nos cenários de stress.
 *
 * Usar o CEMA para dimensionar a reserva a infla (você guardaria para sustentar
 * um padrão que não manteria desempregado). Assumir que tudo é cortável a
 * subdimensiona e é irreal — ninguém para de comer. O CCM é o meio honesto:
 * rígida não cede, ajustável comprime, discricionária zera.
 */
export interface ExpenseEntry {
  amount: Decimal;
  dueDate: Date;
  status: EntryStatus;
  nature: string;
  /** `Subcategory.rigidez`, já resolvido pelo chamador. Null = não classificada. */
  rigidez: Rigidez | null;
  /**
   * Despesa que não acontece todo mês (IPVA, IPTU, matrícula, seguro anual).
   * §11.4 manda convertê-la em equivalente mensal — mas ela precisa sair da
   * série mensal **antes** da mediana, senão conta duas vezes no mês em que
   * ocorreu. A especificação não menciona isso e é onde a maioria das
   * implementações erra.
   */
  isPeriodic: boolean;
}

export interface ExpenseBaseline {
  /** Custo essencial mensal ajustado — mediana dos meses observados + duodécimo das periódicas. */
  cema: Decimal;
  /** Custo de contingência mensal — rígidas inteiras + ajustáveis comprimidas. Discricionárias fora. */
  ccm: Decimal;
  /** Decomposição, para a tela poder explicar de onde veio o número (§41/§53). */
  rigidasMensais: Decimal;
  ajustaveisMensais: Decimal;
  discricionariasMensais: Decimal;
  /** Equivalente mensal das despesas essenciais periódicas (IPVA, IPTU…). */
  periodicasMensalizadas: Decimal;
  /** Essencial ainda sem classificação de rigidez — tratado como rígido, ver nota. */
  naoClassificadasMensais: Decimal;
  monthsObserved: number;
  confidence: ConfiancaAnalise;
}

function median(values: Decimal[]): Decimal {
  if (values.length === 0) return new Decimal(0);
  const sorted = [...values].sort((a, b) => a.comparedTo(b));
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return sorted[middle - 1].plus(sorted[middle]).div(2);
}

function confidenceFor(monthsObserved: number, temNaoClassificada: boolean): ConfiancaAnalise {
  if (monthsObserved >= OBSERVATION_MONTHS_PREFERRED) return temNaoClassificada ? "ALTA" : "MUITO_ALTA";
  if (monthsObserved >= OBSERVATION_MONTHS_MINIMUM) return temNaoClassificada ? "MODERADA" : "ALTA";
  if (monthsObserved >= 3) return "MODERADA";
  return "BAIXA";
}

/**
 * §11 — "caso haja menos dados, utilizar os meses disponíveis e reduzir a
 * confiança da análise". Recorta a janela para começar no primeiro mês com
 * movimento, em vez de preencher com zero o período anterior ao uso do sistema.
 *
 * **Bug real que isto corrige (2026-08-16, achado por teste de integração):**
 * sem o recorte, quem tinha 6 meses de histórico numa janela de 12 recebia a
 * mediana de `[0,0,0,0,0,0,X,X,X,X,X,X]` — ou seja, **metade** do custo
 * essencial real. Isso subestimaria a reserva de todo usuário novo, que é
 * justamente quem mais precisa de um número correto. Os testes unitários não
 * pegaram porque sempre criavam dado para a janela inteira.
 */
function janelaObservada(
  entries: ExpenseEntry[],
  periods: { start: Date; end: Date }[],
): { start: Date; end: Date }[] {
  const comMovimento = entries.filter((e) => !e.isPeriodic);
  if (comMovimento.length === 0) return periods;

  const primeiro = comMovimento.reduce(
    (min, e) => (e.dueDate < min ? e.dueDate : min),
    comMovimento[0].dueDate,
  );
  const recortada = periods.filter((p) => p.end >= primeiro);
  // Nunca devolve vazio: se todo lançamento é mais recente que a janela, o mês
  // mais próximo ainda representa a observação disponível.
  return recortada.length > 0 ? recortada : periods.slice(0, 1);
}

/**
 * Mediana mensal de um grupo de despesas, ignorando as periódicas.
 *
 * **Mediana e não média** (§11.4): um mês com uma despesa médica atípica
 * puxaria a média para cima e inflaria a reserva de alguém que não tem esse
 * gasto todo mês.
 */
function medianaMensal(entries: ExpenseEntry[], periods: { start: Date; end: Date }[]): Decimal {
  const mensais = periods.map((p) =>
    entries
      .filter((e) => !e.isPeriodic && isWithin(e.dueDate, p.start, p.end))
      .reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0)),
  );
  return median(mensais);
}

/**
 * CEMA e CCM a partir do histórico real.
 *
 * `reducaoAjustavelPct` vem de `MethodologyParameter` (global, admin-only);
 * o padrão do `config.ts` é só fallback quando a tabela não tem o registro.
 *
 * **Despesa essencial não classificada entra como rígida.** É a escolha
 * conservadora: assumir que ela comprime reduziria a reserva com base em algo
 * que ninguém decidiu. O campo `naoClassificadasMensais` existe para a tela
 * poder mostrar quanto do número depende dessa suposição.
 */
export function computeExpenseBaseline(
  entries: ExpenseEntry[],
  referenceDate: Date,
  monthsBack: number = OBSERVATION_MONTHS_PREFERRED,
  reducaoAjustavelPct: number = CCM_REDUCAO_AJUSTAVEL_PCT_PADRAO,
): ExpenseBaseline {
  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();
  // Meses fechados — o corrente ainda está em curso e entraria como queda
  // artificial de despesa (mesma convenção de lib/finance/reserve.ts).
  const janelaCompleta = Array.from({ length: Math.max(0, monthsBack) }, (_, i) =>
    monthRange(refYear, refMonth - (i + 1)),
  );

  const despesas = entries.filter((e) => e.nature === "DESPESA" && SETTLED_STATUSES.has(e.status));
  // §11 — usa só os meses efetivamente disponíveis; ver `janelaObservada`.
  const periods = janelaObservada(despesas, janelaCompleta);

  const rigidas = despesas.filter((e) => e.rigidez === "RIGIDA");
  const ajustaveis = despesas.filter((e) => e.rigidez === "AJUSTAVEL");
  const discricionarias = despesas.filter((e) => e.rigidez === "DISCRICIONARIA");
  const naoClassificadas = despesas.filter((e) => e.rigidez === null);

  const rigidasMensais = medianaMensal(rigidas, periods);
  const ajustaveisMensais = medianaMensal(ajustaveis, periods);
  const discricionariasMensais = medianaMensal(discricionarias, periods);
  const naoClassificadasMensais = medianaMensal(naoClassificadas, periods);

  // §11.4 — periódicas viram duodécimo. Só as essenciais (não discricionárias):
  // uma viagem anual não é custo essencial que precise de provisão na reserva.
  const periodicasEssenciais = despesas.filter((e) => e.isPeriodic && e.rigidez !== "DISCRICIONARIA");
  const totalPeriodicas = periodicasEssenciais
    .filter((e) => periods.some((p) => isWithin(e.dueDate, p.start, p.end)))
    .reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0));
  const periodicasMensalizadas = periods.length > 0 ? totalPeriodicas.div(periods.length) : new Decimal(0);

  const cema = rigidasMensais
    .plus(ajustaveisMensais)
    .plus(naoClassificadasMensais)
    .plus(periodicasMensalizadas);

  const fatorRetencao = new Decimal(100 - reducaoAjustavelPct).div(100);
  const ccm = rigidasMensais
    .plus(ajustaveisMensais.times(fatorRetencao))
    .plus(naoClassificadasMensais) // conservador: sem decisão, não comprime
    .plus(periodicasMensalizadas);

  return {
    cema,
    ccm,
    rigidasMensais,
    ajustaveisMensais,
    discricionariasMensais,
    periodicasMensalizadas,
    naoClassificadasMensais,
    monthsObserved: periods.length,
    confidence: confidenceFor(periods.length, naoClassificadasMensais.greaterThan(0)),
  };
}

/**
 * §28 — Índice de Rigidez Financeira: quanto da renda está preso em despesa que
 * não cede. Quanto maior, menor a capacidade de se adaptar numa crise.
 *
 * Diagnóstico, não multiplicador da reserva — a rigidez já age no cálculo pela
 * via do CCM, e usá-la também como fator contaria a mesma coisa duas vezes.
 */
export function indiceRigidezFinanceira(rigidasMensais: Decimal, rendaLiquidaMedia: Decimal): number | null {
  if (rendaLiquidaMedia.lessThanOrEqualTo(0)) return null;
  return rigidasMensais.div(rendaLiquidaMedia).times(100).toNumber();
}
