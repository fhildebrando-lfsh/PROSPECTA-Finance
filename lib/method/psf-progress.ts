import type { PsfFaixa } from "./psf";

/**
 * Progressão das faixas do PSF (§8.3) — puro.
 *
 * Existe para a tela poder mostrar **onde o indicador está na escala** e **se
 * ele mudou de nível desde a última foto**, sem repetir essa lógica em JSX.
 *
 * A escala tem cinco degraus e é ordinal, não numérica: a distância entre
 * "frágil" e "em construção" não é comparável a nenhuma quantidade. Por isso o
 * que se mede aqui é **posição no degrau**, nunca uma nota — a mesma razão pela
 * qual o PSF usa faixas em vez de nota de 0 a 10.
 */
export const FAIXA_ORDER: readonly PsfFaixa[] = [
  "critico",
  "fragil",
  "em_construcao",
  "saudavel",
  "consolidado",
];

/** Quantos degraus a escala tem — a barra desenha um segmento por degrau. */
export const FAIXA_STEPS = FAIXA_ORDER.length;

/** Índice 0–4 do degrau; `null` para indicador não avaliado. */
export function faixaIndex(faixa: PsfFaixa | null): number | null {
  if (faixa === null) return null;
  const i = FAIXA_ORDER.indexOf(faixa);
  return i === -1 ? null : i;
}

/**
 * Preenchimento da barra, 0–100. O primeiro degrau já preenche 1/5: estar em
 * "crítico" é estar na escala, e uma barra vazia leria como "sem avaliação",
 * que é um estado diferente e tem representação própria.
 */
export function faixaProgressPct(faixa: PsfFaixa | null): number {
  const i = faixaIndex(faixa);
  if (i === null) return 0;
  return ((i + 1) / FAIXA_STEPS) * 100;
}

export type MudancaDeNivel = "subiu" | "desceu" | "igual";

export interface EvolucaoFaixa {
  mudanca: MudancaDeNivel;
  /** Quantos degraus, em módulo. Zero quando não mudou. */
  degraus: number;
}

/**
 * Compara a faixa atual com a da foto anterior.
 *
 * Devolve `null` quando a comparação não é honesta: sem foto anterior, ou com
 * qualquer um dos lados não avaliado. Tratar "não avaliado" como degrau zero
 * inventaria uma queda que nunca houve — o indicador não piorou, ele passou a
 * (ou deixou de) ter dado.
 */
export function evolucaoFaixa(anterior: PsfFaixa | null | undefined, atual: PsfFaixa | null): EvolucaoFaixa | null {
  if (anterior === undefined || anterior === null || atual === null) return null;

  const a = faixaIndex(anterior);
  const b = faixaIndex(atual);
  if (a === null || b === null) return null;

  if (b === a) return { mudanca: "igual", degraus: 0 };
  return { mudanca: b > a ? "subiu" : "desceu", degraus: Math.abs(b - a) };
}

/** Forma do JSON gravado em `HealthSnapshot.indicators`. */
export type SnapshotIndicators = Record<string, { faixa: PsfFaixa | null; valor: number | null } | undefined>;

/**
 * Lê a faixa de um indicador dentro do JSON do snapshot, tolerando formato
 * inesperado. Uma foto antiga com chave a menos não pode quebrar a tela — ela
 * simplesmente não tem comparação para aquele indicador.
 */
export function faixaDoSnapshot(indicators: unknown, chave: string): PsfFaixa | null {
  if (typeof indicators !== "object" || indicators === null) return null;
  const entrada = (indicators as SnapshotIndicators)[chave];
  if (!entrada || typeof entrada !== "object") return null;
  const faixa = entrada.faixa;
  return faixa != null && FAIXA_ORDER.includes(faixa) ? faixa : null;
}
