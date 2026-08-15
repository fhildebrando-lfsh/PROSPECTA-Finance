import { Decimal, type Period } from "@/lib/finance/types";
import { daysBetween, isWithin } from "@/lib/finance/dates";

/**
 * §13.6 da Metodologia PROSPECTA v5.0 — Índice de Consistência, o gate da
 * Fase 2 em código. Pesos e composição confirmados com o usuário em
 * 2026-08-15 (ARQUITETURA-METODO-PROSPECTAR.md §5.6/Etapa 2). Cada
 * componente é 0–1; `null` = "não avaliado" (não penaliza — mesmo espírito
 * do PSF, §8.3), nunca contado como falha.
 */
export const CONSISTENCY_WEIGHTS = {
  coberturaTemporal: 25,
  qualidadeCategorizacao: 25,
  filaDeIncidentes: 20,
  coberturaDeCarteiras: 15,
  conciliacao: 15,
} as const;

export interface ConsistencyComponents {
  coberturaTemporal: number;
  qualidadeCategorizacao: number | null;
  filaDeIncidentes: number;
  coberturaDeCarteiras: number | null;
  conciliacao: number | null;
}

export interface ConsistencyIndex {
  components: ConsistencyComponents;
  /** 0–100. `null` só quando NENHUM componente tem dado (workspace vazio). */
  overall: number | null;
}

/** Proporção de dias do período com pelo menos 1 lançamento (por Vence). */
export function coberturaTemporal(entries: { dueDate: Date }[], period: Period): number {
  const totalDays = daysBetween(period.start, period.end) + 1;
  if (totalDays <= 0) return 0;

  const daysWithEntry = new Set(
    entries.filter((e) => isWithin(e.dueDate, period.start, period.end)).map((e) => daysBetween(period.start, e.dueDate)),
  );
  return Math.min(1, daysWithEntry.size / totalDays);
}

/** Proporção de lançamentos do período com subcategoria preenchida (categoria já é sempre obrigatória). */
export function qualidadeCategorizacao(
  entries: { dueDate: Date; subcategoryId: string | null }[],
  period: Period,
): number | null {
  const inScope = entries.filter((e) => isWithin(e.dueDate, period.start, period.end));
  if (inScope.length === 0) return null;

  const comSubcategoria = inScope.filter((e) => e.subcategoryId != null).length;
  return comSubcategoria / inScope.length;
}

/**
 * 1 quando não há incidente aberto; degrada conforme a proporção de
 * incidentes abertos há mais de `maxDays` (30, §13.6) cresce — nunca vira 0
 * de repente ao passar 1 dia do limite, é gradual conforme mais incidentes
 * acumulam atraso.
 */
export function filaDeIncidentes(openIncidents: { createdAt: Date }[], today: Date, maxDays = 30): number {
  if (openIncidents.length === 0) return 1;

  const overdue = openIncidents.filter((i) => daysBetween(i.createdAt, today) > maxDays).length;
  return 1 - overdue / openIncidents.length;
}

/** Proporção de carteiras ativas com pelo menos 1 movimento no período. */
export function coberturaDeCarteiras(
  entries: { walletId: string; dueDate: Date }[],
  activeWalletIds: string[],
  period: Period,
): number | null {
  if (activeWalletIds.length === 0) return null;

  const inScope = entries.filter((e) => isWithin(e.dueDate, period.start, period.end));
  const walletsComMovimento = new Set(inScope.map((e) => e.walletId));
  const cobertas = activeWalletIds.filter((id) => walletsComMovimento.has(id)).length;
  return cobertas / activeWalletIds.length;
}

export interface ConsistencyReconciliation {
  walletId: string;
  declaredBalance: Decimal;
  systemBalance: Decimal;
  checkedAt: Date;
}

/**
 * Média, entre as carteiras ativas que JÁ têm ao menos uma conciliação
 * (`BalanceReconciliation`, seção 5.6), de `1 − (diferença ÷ max(|declarado|, 1))`,
 * usando sempre a checagem mais recente por carteira. Carteira nunca
 * conferida fica de fora da média (não avaliada, não penalizada) — se
 * nenhuma carteira ativa tiver conciliação nenhuma, o componente inteiro é
 * `null`.
 */
export function conciliacao(
  reconciliations: ConsistencyReconciliation[],
  activeWalletIds: string[],
): number | null {
  const maisRecentePorCarteira = new Map<string, ConsistencyReconciliation>();
  for (const r of reconciliations) {
    if (!activeWalletIds.includes(r.walletId)) continue;
    const existing = maisRecentePorCarteira.get(r.walletId);
    if (!existing || r.checkedAt > existing.checkedAt) maisRecentePorCarteira.set(r.walletId, r);
  }
  if (maisRecentePorCarteira.size === 0) return null;

  const scores = Array.from(maisRecentePorCarteira.values()).map((r) => {
    const diff = r.declaredBalance.minus(r.systemBalance).abs();
    const declaradoAbs = r.declaredBalance.abs();
    const denom = declaradoAbs.greaterThan(1) ? declaradoAbs : new Decimal(1);
    const ratio = diff.div(denom).toNumber();
    return Math.max(0, 1 - ratio);
  });

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * Composto ponderado (pesos de `CONSISTENCY_WEIGHTS`) — componentes `null`
 * ("não avaliado") são excluídos e o peso deles é redistribuído
 * proporcionalmente entre os que têm dado, nunca tratado como 0. `overall`
 * só é `null` quando absolutamente nenhum componente pôde ser calculado.
 */
export function computeConsistencyIndex(components: ConsistencyComponents): ConsistencyIndex {
  const pairs = (Object.entries(components) as [keyof ConsistencyComponents, number | null][]).filter(
    (pair): pair is [keyof ConsistencyComponents, number] => pair[1] !== null,
  );

  if (pairs.length === 0) return { components, overall: null };

  const totalWeight = pairs.reduce((sum, [key]) => sum + CONSISTENCY_WEIGHTS[key], 0);
  const weightedSum = pairs.reduce((sum, [key, value]) => sum + CONSISTENCY_WEIGHTS[key] * value, 0);

  return { components, overall: Math.round((weightedSum / totalWeight) * 100) };
}
