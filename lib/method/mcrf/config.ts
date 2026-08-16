/**
 * PROSPECTA-MCRF — parâmetros centralizados e versionados.
 *
 * §52 da especificação: "Não espalhar números mágicos pelo código." §48: todo
 * cálculo registra a versão da metodologia que o produziu, e cálculo histórico
 * nunca é sobrescrito silenciosamente. Mudar um número aqui **exige** subir a
 * versão — senão duas fotos com a mesma versão teriam sido geradas por regras
 * diferentes, e a comparação no tempo (que é o propósito do painel) mentiria.
 */
export const METHODOLOGY_VERSION = "PROSPECTA-MCRF-1.0";

/**
 * §11 — janela preferida de histórico para medir custo essencial e renda.
 * 12 meses captura sazonalidade e despesa anual; 6 é o mínimo aceitável com
 * confiança reduzida; abaixo disso o cálculo roda mas se declara pouco
 * confiável (§9), nunca se recusa a responder.
 */
export const OBSERVATION_MONTHS_PREFERRED = 12;
export const OBSERVATION_MONTHS_MINIMUM = 6;

/**
 * §9 — Confiança da Análise. Faixas sobre a quantidade de meses observados.
 * Deliberadamente grosseiras: §9 manda evitar falsa precisão, e uma escala fina
 * sugeriria que a diferença entre 7 e 8 meses de histórico é significativa.
 */
export type ConfiancaAnalise = "MUITO_ALTA" | "ALTA" | "MODERADA" | "BAIXA";

/**
 * §11.2/§12 — quanto uma despesa **ajustável** encolhe durante a crise.
 *
 * Este é o **padrão inicial e o fallback**, não a fonte de verdade: o valor
 * vigente vive em `MethodologyParameter` (`ccm.reducao_ajustavel_pct`), porque
 * o usuário decidiu em 2026-08-16 que o número é global e editável só pelo
 * admin da plataforma. Se a tabela não tiver o registro, o motor usa este valor
 * e continua funcionando — nunca falha por falta de configuração.
 *
 * 30% foi a escolha do usuário: corte real, sem a fantasia de que dá para viver
 * com metade da comida. Rígida não cede; discricionária zera.
 */
export const CCM_REDUCAO_AJUSTAVEL_PCT_PADRAO = 30;

/** Chaves dos parâmetros — string solta espalhada pelo código vira typo silencioso. */
export const PARAM_CCM_REDUCAO_AJUSTAVEL = "ccm.reducao_ajustavel_pct";

/** §8 — origem do dado. Inferido nunca é tratado como fato confirmado. */
export type DataSource = "SYSTEM_OBSERVED" | "USER_DECLARED" | "OFFICIAL_EXTERNAL_DATA" | "SYSTEM_INFERRED";

export interface Provenance {
  source: DataSource;
  /** Meses de histórico que sustentam o valor, quando SYSTEM_OBSERVED. */
  historyMonths?: number;
  confidence: ConfiancaAnalise;
}
