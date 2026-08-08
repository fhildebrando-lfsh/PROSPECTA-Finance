import { slugify } from "@/lib/slug";
import { Decimal } from "@/lib/finance/types";

export interface InstallmentRowForGrouping {
  walletId: string;
  categoryId: string;
  description: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
  amount: Decimal;
}

export interface ClusterResult<T> {
  /** Clusters onde os números de parcela são todos distintos — seguro atribuir `group_id`. */
  safe: T[][];
  /** Clusters com número de parcela repetido (provavelmente duas séries diferentes que
   * coincidem em carteira+categoria+descrição+total) — ficam sem `group_id` automático,
   * para revisão manual. */
  ambiguous: T[][];
}

/** Tolerância entre parcelas da mesma compra: absorve só o centavo de resto que a divisão
 * de um total por N parcelas iguais deixa sobrar numa delas — não o bastante para
 * confundir duas compras de valores diferentes (ver `splitByAmount`). */
const AMOUNT_TOLERANCE = 0.02;

/**
 * Agrupa linhas de parcelamento (`installmentTotal >= 2`) por carteira +
 * categoria + descrição (normalizada) + total de parcelas — a heurística
 * usada tanto pela importação de CSV (`app/api/import/commit/route.ts`)
 * quanto pelo backfill retroativo (`scripts/backfill-installment-groups.ts`).
 * §8.4 — `group_id` é sempre atribuído automaticamente, nunca digitado; isso
 * é o que faz isso valer também para dado que já entrou sem ele.
 *
 * Descrição genérica de loja (ex.: "MERCADO LIVRE") faz duas compras
 * completamente diferentes caírem na mesma chave carteira+categoria+
 * descrição+total — por isso cada cluster ainda é subdividido por valor da
 * parcela (`splitByAmount`) antes da checagem de ambiguidade.
 */
export function clusterInstallmentRows<T extends InstallmentRowForGrouping>(rows: T[]): ClusterResult<T> {
  const byKey = new Map<string, T[]>();
  for (const row of rows) {
    if (!row.installmentTotal || row.installmentTotal < 2 || row.installmentNumber == null) continue;
    const key = `${row.walletId}::${row.categoryId}::${slugify(row.description)}::${row.installmentTotal}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }

  const safe: T[][] = [];
  const ambiguous: T[][] = [];
  for (const cluster of byKey.values()) {
    for (const subCluster of splitByAmount(cluster)) {
      const numbers = subCluster.map((r) => r.installmentNumber);
      const distinct = new Set(numbers).size === numbers.length;
      (distinct ? safe : ambiguous).push(subCluster);
    }
  }

  return { safe, ambiguous };
}

/**
 * Separa um cluster por valor de parcela: ordena por `|amount|` e começa um
 * novo subgrupo sempre que o salto para o próximo valor passar de
 * `AMOUNT_TOLERANCE` — duas compras reais de valores diferentes (ex.: uma
 * série de R$ 88,24/mês e outra de R$ 474,92/mês, ambas "MERCADO LIVRE" em
 * 12x) saltam dezenas de reais entre si, bem acima da tolerância; parcelas
 * da mesma compra variam no máximo 1-2 centavos entre elas (resto da divisão
 * do total por N).
 */
function splitByAmount<T extends InstallmentRowForGrouping>(cluster: T[]): T[][] {
  if (cluster.length <= 1) return [cluster];

  const sorted = [...cluster].sort((a, b) => a.amount.abs().comparedTo(b.amount.abs()));
  const groups: T[][] = [];
  let current: T[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].amount.abs().minus(sorted[i - 1].amount.abs()).abs().toNumber();
    if (gap <= AMOUNT_TOLERANCE) {
      current.push(sorted[i]);
    } else {
      groups.push(current);
      current = [sorted[i]];
    }
  }
  groups.push(current);
  return groups;
}
