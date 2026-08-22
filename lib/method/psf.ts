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
 * Liquidez pelo MCRF (Etapa 9-A.7) — substitui o alvo fixo de 6 meses pela
 * **Reserva Recomendada calculada para esta pessoa** (`reserve-engine.ts`).
 *
 * É a diferença entre "você tem 6 meses de despesa guardados" e "você tem o
 * suficiente para atravessar os cenários que de fato te ameaçam". Um militar
 * com renda estável e um autônomo com renda volátil precisam de reservas
 * diferentes; o alvo fixo tratava os dois igual.
 *
 * Cai de volta em `liquidez()` quando não há avaliação MCRF disponível — o
 * indicador nunca deixa de existir por falta do módulo novo.
 */
export function liquidezPorReservaRecomendada(
  reservaElegivel: Decimal,
  reservaRecomendada: Decimal,
): PsfIndicatorResult {
  if (reservaRecomendada.lessThanOrEqualTo(0)) return NAO_AVALIADO;
  return indicator(reservaElegivel.div(reservaRecomendada).times(100).toNumber());
}

/**
 * Proteção — usada até a Etapa 9-A.2 existir. Mantida por compatibilidade e
 * como fallback; a versão completa é `protecaoCompleta()` logo abaixo.
 */
export function protecao(reservePercent: number): PsfIndicatorResult {
  return indicator(reservePercent);
}

/**
 * **Proteção completa (Etapa 9-A.7) — a metade que faltava chegou.**
 *
 * A fórmula de §5.3.1 sempre foi `(reserva atingida % × 50%) + (coberturas ÷
 * recomendadas × 50%)`, mas a segunda metade dependia de `InsurancePolicy`,
 * que não existia. Enquanto isso, Proteção espelhava Liquidez — e ficava em
 * zero para quem tinha seguro contratado, o que era simplesmente errado.
 *
 * Foi exatamente esse buraco que motivou antecipar a Etapa 12 para dentro da
 * 9-A: o indicador só sai de zero quando reserva **e** seguros existem juntos.
 *
 * `coberturaSegurosPercent` é 0–100 e vem do MCRF (quantos dos riscos materiais
 * têm alguma proteção contratada). Nulo = sem dado de seguro; nesse caso o peso
 * inteiro volta para a reserva, em vez de punir quem ainda não cadastrou —
 * mesma disciplina de "ausência de dado não vira nota ruim" que rege o resto
 * do PSF.
 */
export function protecaoCompleta(
  reservePercent: number,
  coberturaSegurosPercent: number | null,
): PsfIndicatorResult {
  if (coberturaSegurosPercent === null) return indicator(reservePercent);
  return indicator(reservePercent * 0.5 + coberturaSegurosPercent * 0.5);
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

/**
 * §5.3.1 — Longevidade: `min(100, (aporte atual ÷ aporte necessário) × 100)`.
 *
 * O quociente já vem calculado como `suficienciaPct` em
 * `lib/method/retirement.ts`, porque é lá que estão as premissas que o
 * produziram. Aqui ele só vira faixa.
 *
 * `null` significa **não avaliado**, nunca faixa ruim: sem uma projeção salva
 * não há aporte necessário com que comparar, e mostrar "crítico" nesse caso
 * puniria o cliente por um trabalho que o consultor ainda não fez.
 */
export function longevidade(suficienciaPct: number | null): PsfIndicatorResult {
  if (suficienciaPct === null) return NAO_AVALIADO;
  const clamped = Math.max(0, Math.min(100, suficienciaPct));
  return { faixa: faixaForPercent(clamped), valor: clamped };
}

/**
 * §5.3.1 — Continuidade: `(itens do checklist concluídos ÷ total) × 100`.
 *
 * `null` = não avaliado, nunca faixa ruim. Sem um PCP produzido não há
 * checklist com que medir, e "crítico" nesse caso puniria o cliente por
 * trabalho que o consultor ainda não fez — mesma decisão de `longevidade`.
 */
export function continuidade(percentualDoChecklist: number | null): PsfIndicatorResult {
  if (percentualDoChecklist === null) return NAO_AVALIADO;
  const clamped = Math.max(0, Math.min(100, percentualDoChecklist));
  return { faixa: faixaForPercent(clamped), valor: clamped };
}
