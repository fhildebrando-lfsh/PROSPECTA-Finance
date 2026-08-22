import type { MacroBloco } from "@/app/generated/prisma/enums";

/**
 * Etapa 14 — metas da Régua de Alocação por macrobloco (§11.4). Puro.
 *
 * Eixo diferente do PIP (`lib/method/pip.ts`): aqui é **para onde vai a
 * renda** — essencial, estilo de vida, obrigação, poupança; lá é como o já
 * poupado está distribuído entre classes de investimento. O roadmap tratava os
 * dois como um modelo só; não são.
 *
 * §11.4 pede trajetória (hoje / 12 meses / 24 meses), e é por isso que a meta
 * tem horizonte: a Régua não serve para cobrar perfeição imediata, e sim para
 * mostrar um caminho. O texto de origem é explícito em que ela é "instrumento
 * de diagnóstico e trajetória, nunca norma".
 */

export const MACRO_BLOCOS: MacroBloco[] = ["ESSENCIAL", "ESTILO_DE_VIDA", "OBRIGACAO", "POUPANCA"];

export const MACRO_BLOCO_LABELS: Record<MacroBloco, string> = {
  ESSENCIAL: "Essencial",
  ESTILO_DE_VIDA: "Estilo de vida",
  OBRIGACAO: "Obrigações",
  POUPANCA: "Poupança",
};

export interface TargetInput {
  macroBloco: MacroBloco;
  targetPercent: number;
  /** Nulo = alvo atual, sem prazo. */
  horizonMonths: number | null;
}

export interface TargetComparison {
  macroBloco: MacroBloco;
  label: string;
  actualPercent: number;
  targetPercent: number | null;
  /** Positivo = acima da meta; negativo = abaixo. Nulo sem meta definida. */
  gapPp: number | null;
}

/**
 * Compara a distribuição de hoje com as metas de um horizonte.
 *
 * Macrobloco sem meta definida entra com `targetPercent: null` em vez de zero:
 * zero afirmaria "a meta é não gastar nada aqui", que é outra coisa — e para
 * Essencial seria absurdo.
 */
export function compareToTargets(
  actualPercent: Record<MacroBloco, number>,
  targets: TargetInput[],
  horizonMonths: number | null,
): TargetComparison[] {
  const doHorizonte = new Map(
    targets.filter((t) => t.horizonMonths === horizonMonths).map((t) => [t.macroBloco, t.targetPercent]),
  );

  return MACRO_BLOCOS.map((mb) => {
    const alvo = doHorizonte.get(mb) ?? null;
    const atual = actualPercent[mb] ?? 0;
    return {
      macroBloco: mb,
      label: MACRO_BLOCO_LABELS[mb],
      actualPercent: atual,
      targetPercent: alvo,
      gapPp: alvo === null ? null : atual - alvo,
    };
  });
}

/** Os horizontes que têm alguma meta, em ordem — `null` (hoje) primeiro. */
export function horizontesDefinidos(targets: TargetInput[]): (number | null)[] {
  const set = new Set<number | null>(targets.map((t) => t.horizonMonths));
  return [...set].sort((a, b) => (a ?? 0) - (b ?? 0));
}

export interface TargetValidation {
  erros: string[];
  avisos: string[];
  valida: boolean;
}

/**
 * A soma das metas de um horizonte precisa fechar em 100%: são fatias da mesma
 * renda. Tolerância de 0,5 ponto para não implicar com arredondamento — o
 * documento de origem avisa para não sugerir precisão que o dado não tem.
 */
export function validateTargets(targets: TargetInput[], horizonMonths: number | null): TargetValidation {
  const doHorizonte = targets.filter((t) => t.horizonMonths === horizonMonths);
  const erros: string[] = [];
  const avisos: string[] = [];

  if (doHorizonte.length === 0) return { erros, avisos, valida: true };

  for (const t of doHorizonte) {
    if (t.targetPercent < 0 || t.targetPercent > 100) {
      erros.push(`${MACRO_BLOCO_LABELS[t.macroBloco]}: a meta precisa ficar entre 0% e 100%.`);
    }
  }

  const soma = doHorizonte.reduce((s, t) => s + t.targetPercent, 0);
  if (Math.abs(soma - 100) > 0.5) {
    erros.push(`As metas deste horizonte somam ${soma.toFixed(1)}% — precisam fechar em 100%, são fatias da mesma renda.`);
  }

  if (doHorizonte.length < MACRO_BLOCOS.length) {
    avisos.push("Nem todos os macroblocos têm meta neste horizonte — os que faltam ficam sem referência.");
  }

  return { erros, avisos, valida: erros.length === 0 };
}
