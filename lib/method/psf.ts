import type { Decimal } from "@/lib/finance/types";

/**
 * §8 da Metodologia PROSPECTA v5.0 (ARQUITETURA-METODO-PROSPECTAR.md §5.3.1,
 * Etapa 5, 2026-08-15) — Painel de Saúde Financeira. Escala qualitativa de 5
 * faixas (§8.3) sobre um valor 0–100 — nunca nota de 0 a 10 ("número exato
 * sugere precisão que o dado não tem"). `faixa: null` = "não avaliado", nunca
 * faixa ruim — indicador sem dado suficiente é estado explícito, não erro.
 */
export type PsfFaixa = "critico" | "fragil" | "em_construcao" | "saudavel" | "consolidado";

export interface PsfIndicatorResult {
  faixa: PsfFaixa | null;
  valor: number | null;
}

const NAO_AVALIADO: PsfIndicatorResult = { faixa: null, valor: null };

/** Limiares redondos de propósito (§8.3) — um corte em "63,4%" seria falso rigor. */
export function faixaForPercent(percent: number): PsfFaixa {
  const clamped = Math.max(0, Math.min(100, percent));
  if (clamped <= 20) return "critico";
  if (clamped <= 40) return "fragil";
  if (clamped <= 60) return "em_construcao";
  if (clamped <= 80) return "saudavel";
  return "consolidado";
}

function indicator(percent: number): PsfIndicatorResult {
  const clamped = Math.max(0, Math.min(100, percent));
  return { faixa: faixaForPercent(clamped), valor: clamped };
}

/** Organização — o Índice de Consistência (lib/method/consistency.ts) já é 0–100, usado direto, sem transformação. */
export function organizacao(consistencyOverall: number | null): PsfIndicatorResult {
  if (consistencyOverall === null) return NAO_AVALIADO;
  return indicator(consistencyOverall);
}

/**
 * Endividamento — `100 − min(100, (compromisso mensal ÷ renda líquida média) × 200)`.
 * Denominador é renda, não despesa (§13.5 — diferente da tela de Dívidas,
 * que soma sobre despesa; aqui é a régua que análise de crédito usa). `× 200`
 * faz 50% de comprometimento da renda zerar a nota.
 */
export function endividamento(monthlyDebtCommitment: Decimal, averageMonthlyIncome: Decimal): PsfIndicatorResult {
  if (averageMonthlyIncome.lessThanOrEqualTo(0)) return NAO_AVALIADO;
  const ratio = monthlyDebtCommitment.abs().div(averageMonthlyIncome).toNumber();
  return indicator(100 - Math.min(100, ratio * 200));
}

/**
 * Liquidez — meses de fôlego: saldo líquido disponível ÷ despesa essencial
 * média, sobre um alvo de 6 meses (mesma convenção de `lib/finance/
 * reserve.ts`). **Não é** progresso de uma `Goal` de reserva específica —
 * isso continua sendo só `lib/finance/goal.ts::goalProgress()`, em
 * Patrimônio → Metas e na seção "Metas" do Painel (o Painel já teve um bug
 * corrigido por calcular sua própria meta de reserva em paralelo à Goal real
 * do usuário — ver comentário em `app/(app)/painel/page.tsx`). Este
 * indicador mede fôlego geral (§7.2: "capacidade de enfrentar compromissos e
 * imprevistos"), não progresso de uma meta específica — os dois convivem sem
 * conflito porque respondem perguntas diferentes.
 */
export function liquidez(liquidBalance: Decimal, averageMonthlyExpense: Decimal): PsfIndicatorResult {
  if (averageMonthlyExpense.lessThanOrEqualTo(0)) return NAO_AVALIADO;
  const monthsOfCoverage = liquidBalance.div(averageMonthlyExpense).toNumber();
  return indicator((monthsOfCoverage / 6) * 100);
}

/**
 * Proteção — fórmula completa é `(reserva atingida % × 50%) + (coberturas
 * cadastradas ÷ recomendadas × 50%)` (§5.3.1), mas o cadastro de apólices
 * (`InsurancePolicy`) só chega na Etapa 12 — até lá, 100% do peso fica na
 * reserva (mesmo valor de `liquidez`, capado em 100). Revisitar esta função
 * quando a Etapa 12 landar, trocando pra ponderação 50/50 de verdade.
 */
export function protecao(reservePercent: number): PsfIndicatorResult {
  return indicator(reservePercent);
}

/**
 * Construção Patrimonial — `min(100, (% da renda em Poupança do período ÷
 * piso da banda de renda do cliente, §11.3) × 100)`. Atingir o piso da
 * própria faixa de renda já vale 100% — usa `lib/method/allocation.ts`
 * (`percentOfIncome`, `bandForIncome`), nunca um cálculo paralelo de banda.
 */
export function construcaoPatrimonial(poupancaPercent: number, bandFloorPercent: number): PsfIndicatorResult {
  if (bandFloorPercent <= 0) return NAO_AVALIADO;
  return indicator((poupancaPercent / bandFloorPercent) * 100);
}

export interface PsfSnapshot {
  organizacao: PsfIndicatorResult;
  endividamento: PsfIndicatorResult;
  liquidez: PsfIndicatorResult;
  /** null quando o workspace não tem nível Max (psf_nivel_2) — nunca calculado sem entitlement. */
  protecao: PsfIndicatorResult | null;
  construcao: PsfIndicatorResult | null;
}
