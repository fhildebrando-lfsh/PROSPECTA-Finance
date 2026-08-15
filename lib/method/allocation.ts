import { Decimal, type EntryNature, type EntryStatus, type Period, type Regime } from "@/lib/finance/types";
import { isWithin } from "@/lib/finance/dates";
import { SETTLED_STATUSES, PENDING_STATUSES } from "@/lib/finance/derived";
import type { MacroBloco } from "@/app/generated/prisma/enums";
import type { Settlement } from "@/lib/finance/period";

/**
 * §11.2 da Metodologia PROSPECTA v5.0 — Régua de Alocação PROSPECTA (RAP).
 * Subconjunto de `Entry` com só o que o cálculo precisa (mesmo espírito de
 * `InstallmentEntry` em lib/finance/open-installments.ts) — não é
 * `FinanceEntry`, que não carrega `categorySlug`/`walletKindCode`/`macroBloco`.
 */
export interface AllocationEntry {
  id: string;
  nature: EntryNature;
  amount: Decimal;
  transactionDate: Date;
  dueDate: Date;
  status: EntryStatus;
  /** Slug da categoria — usado só para achar a perna de entrada de uma
   * transferência (nature=OUTRO, categoria "Transferências") que alimenta
   * o bloco Poupança. */
  categorySlug: string;
  /** kindCode da carteira deste lançamento — usado no mesmo caso acima,
   * para checar se o destino da transferência é uma caixinha. */
  walletKindCode: string;
  /** `macroBlocoOverride ?? subcategory?.macroBloco`, já resolvido pelo call
   * site (ARQUITETURA-METODO-PROSPECTAR.md §5.1) — null quando a natureza
   * não é DESPESA, ou quando é DESPESA mas a subcategoria ainda não foi
   * classificada. */
  macroBloco: MacroBloco | null;
}

export interface AllocationTotals {
  essencial: Decimal;
  estiloDeVida: Decimal;
  obrigacao: Decimal;
  /** Aportes de INVESTIMENTO + transferências pra carteira CONTA_CAIXA —
   * fórmula (b) por soma direta, decisão do usuário em 2026-08-15 (preferida
   * à alternativa residual: mede o que foi guardado de fato, não o que
   * sobrou sem destino). */
  poupanca: Decimal;
  /** DESPESA sem `macroBloco` resolvido (subcategoria nova, ainda sem
   * classificação) — nunca escondido dentro de um dos 4 blocos, mesmo
   * espírito do "não avaliado" do PSF (§8.3). */
  naoClassificado: Decimal;
  receita: Decimal;
}

function dateForRegime(entry: Pick<AllocationEntry, "transactionDate" | "dueDate">, regime: Regime): Date {
  return regime === "caixa" ? entry.dueDate : entry.transactionDate;
}

/**
 * Totais dos 4 blocos da Régua num período — ver ARQUITETURA-METODO-
 * PROSPECTAR.md §5.1 pra fórmula completa. `settlement` obrigatório, sem
 * default, mesmo padrão de `periodTotals()` (Registro Nº 053): força o
 * chamador a declarar se quer realizado ou provisão.
 */
export function computeAllocation(
  entries: AllocationEntry[],
  period: Period,
  settlement: Settlement,
  regime: Regime = "caixa",
): AllocationTotals {
  const statusSet = settlement === "settled" ? SETTLED_STATUSES : PENDING_STATUSES;
  const inScope = entries.filter(
    (e) => isWithin(dateForRegime(e, regime), period.start, period.end) && statusSet.has(e.status),
  );

  let essencial = new Decimal(0);
  let estiloDeVida = new Decimal(0);
  let obrigacao = new Decimal(0);
  let poupancaDeOverride = new Decimal(0);
  let naoClassificado = new Decimal(0);

  for (const e of inScope) {
    if (e.nature !== "DESPESA") continue;
    const amount = e.amount.abs();
    switch (e.macroBloco) {
      case "ESSENCIAL":
        essencial = essencial.plus(amount);
        break;
      case "ESTILO_DE_VIDA":
        estiloDeVida = estiloDeVida.plus(amount);
        break;
      case "OBRIGACAO":
        obrigacao = obrigacao.plus(amount);
        break;
      case "POUPANCA":
        // Raro (override manual numa despesa) — soma junto com a poupança "de verdade" abaixo.
        poupancaDeOverride = poupancaDeOverride.plus(amount);
        break;
      default:
        naoClassificado = naoClassificado.plus(amount);
    }
  }

  const aportesInvestimento = inScope
    .filter((e) => e.nature === "INVESTIMENTO")
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

  const transferenciasParaCaixinha = inScope
    .filter(
      (e) =>
        e.nature === "OUTRO" &&
        e.categorySlug === "transferencias" &&
        e.amount.greaterThan(0) &&
        e.walletKindCode === "CONTA_CAIXA",
    )
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

  const receita = inScope
    .filter((e) => e.nature === "RECEITA")
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));

  return {
    essencial,
    estiloDeVida,
    obrigacao,
    poupanca: aportesInvestimento.plus(transferenciasParaCaixinha).plus(poupancaDeOverride),
    naoClassificado,
    receita,
  };
}

export interface AllocationPercentages {
  essencial: number;
  estiloDeVida: number;
  obrigacao: number;
  poupanca: number;
  naoClassificado: number;
  /** Receita menos a soma dos 5 acima — dinheiro que não foi pra nenhum
   * bloco (ficou parado em conta). Exibido separado, nunca escondido. */
  naoAlocado: number;
}

/** % de cada bloco sobre a receita do período. Todos 0 se receita <= 0 (evita divisão por zero). */
export function percentOfIncome(totals: AllocationTotals): AllocationPercentages {
  if (totals.receita.lessThanOrEqualTo(0)) {
    return { essencial: 0, estiloDeVida: 0, obrigacao: 0, poupanca: 0, naoClassificado: 0, naoAlocado: 0 };
  }

  const pct = (value: Decimal) => value.div(totals.receita).times(100).toNumber();
  const essencial = pct(totals.essencial);
  const estiloDeVida = pct(totals.estiloDeVida);
  const obrigacao = pct(totals.obrigacao);
  const poupanca = pct(totals.poupanca);
  const naoClassificado = pct(totals.naoClassificado);
  const naoAlocado = Math.max(0, 100 - essencial - estiloDeVida - obrigacao - poupanca - naoClassificado);

  return { essencial, estiloDeVida, obrigacao, poupanca, naoClassificado, naoAlocado };
}

/** §11.3 — bandas de referência por faixa de renda líquida familiar. Bandas
 * iniciais, a calibrar com base real (texto de origem já avisa disso). O
 * bloco Obrigações não tem banda-alvo — o alvo é zero (mesmo texto). */
export interface AllocationBand {
  label: string;
  minIncome: number;
  /** null = sem teto (faixa "Acima de R$ 25.000"). */
  maxIncome: number | null;
  essencial: [number, number];
  estiloDeVida: [number, number];
  poupanca: [number, number];
}

export const ALLOCATION_BANDS: AllocationBand[] = [
  { label: "Até R$ 3.000", minIncome: 0, maxIncome: 3000, essencial: [70, 80], estiloDeVida: [8, 15], poupanca: [5, 12] },
  {
    label: "R$ 3.001 – R$ 6.000",
    minIncome: 3001,
    maxIncome: 6000,
    essencial: [58, 70],
    estiloDeVida: [12, 20],
    poupanca: [10, 18],
  },
  {
    label: "R$ 6.001 – R$ 12.000",
    minIncome: 6001,
    maxIncome: 12000,
    essencial: [50, 60],
    estiloDeVida: [18, 25],
    poupanca: [15, 25],
  },
  {
    label: "R$ 12.001 – R$ 25.000",
    minIncome: 12001,
    maxIncome: 25000,
    essencial: [40, 52],
    estiloDeVida: [20, 28],
    poupanca: [22, 32],
  },
  {
    label: "Acima de R$ 25.000",
    minIncome: 25001,
    maxIncome: null,
    essencial: [30, 42],
    estiloDeVida: [20, 30],
    poupanca: [30, 45],
  },
];

/** Banda cuja faixa de renda cobre `monthlyIncome` — cai na última faixa (sem teto) se exceder todas. */
export function bandForIncome(monthlyIncome: Decimal): AllocationBand {
  const income = monthlyIncome.toNumber();
  return ALLOCATION_BANDS.find((band) => band.maxIncome === null || income <= band.maxIncome) ?? ALLOCATION_BANDS[ALLOCATION_BANDS.length - 1];
}

export type BandComparison = "abaixo" | "dentro" | "acima";

/** Onde um percentual cai em relação a uma faixa [min, max] da banda. */
export function compareToBand(percent: number, [min, max]: [number, number]): BandComparison {
  if (percent < min) return "abaixo";
  if (percent > max) return "acima";
  return "dentro";
}
