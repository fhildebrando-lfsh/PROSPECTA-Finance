import { INSTRUMENTS, allFields, type FieldKind, type FormInstrumentCode, type InstrumentSpec } from "./catalog";

/**
 * Validação das respostas dos instrumentos — pura.
 *
 * Devolve **quais** campos faltam, nunca só um booleano: o cliente precisa saber
 * onde voltar, e "incompleto" sem dizer onde é um aviso inútil. Mesma decisão
 * de `checkCompleteness` no catálogo dos entregáveis (Etapa 9).
 */

export type AnswerValue = string | number | boolean | string[] | null | undefined;
export type Answers = Record<string, AnswerValue>;

/** Vazio de verdade: string em branco, array sem item, null e undefined. */
export function isEmpty(v: AnswerValue): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export interface ValidationResult {
  /** Rótulos dos campos obrigatórios ainda em branco. */
  missing: string[];
  isComplete: boolean;
}

export function validateAnswers(code: FormInstrumentCode, answers: Answers): ValidationResult {
  const missing = allFields(code)
    .filter((f) => {
      if (!f.required) return false;
      const v = answers[f.key];
      // `false` num consentimento é ausência de consentimento, não resposta
      // dada — é o único caso em que um booleano válido reprova.
      if (f.kind === "consentimento") return v !== true;
      // Zero é resposta legítima em número (ex.: zero dependentes).
      if (typeof v === "number") return Number.isNaN(v);
      if (typeof v === "boolean") return false;
      return isEmpty(v);
    })
    .map((f) => f.label);

  return { missing, isComplete: missing.length === 0 };
}

/**
 * §12.1 — "o A1 nunca deve passar de 10 minutos. Tudo que puder esperar vai
 * para o A2."
 *
 * A regra existe porque atrito no pré-diagnóstico é o que faz o cliente
 * abandonar ou responder de qualquer jeito. Deixá-la só como comentário
 * significaria descobrir a violação depois de já estar em produção — então ela
 * vira estimativa verificável, e um teste a checa.
 *
 * **Calibração.** Os segundos por tipo não são chute: foram ajustados para que
 * o A1 — com exatamente os campos que §12.3 lista — caia dentro dos "8 a 10
 * minutos" que o próprio documento declara para ele. Essa âncora é o que torna
 * o teto útil. Uma tabela que subestimasse deixaria alguém dobrar o formulário
 * sem o teste acusar, e a regra viraria letra morta — que é justamente o que
 * ela existe para evitar.
 */
const SEGUNDOS_POR_TIPO: Record<FieldKind, number> = {
  consentimento: 12,
  sim_nao: 14,
  escolha: 25,
  faixa: 25,
  likert: 20,
  numero: 34,
  data: 34,
  texto: 42,
  escolha_multipla: 60,
  texto_longo: 150,
};

export function estimatedSeconds(spec: InstrumentSpec): number {
  return spec.blocks
    .flatMap((b) => b.fields)
    .reduce((total, f) => total + SEGUNDOS_POR_TIPO[f.kind], 0);
}

export interface AtritoCheck {
  estimatedMinutes: number;
  maxMinutes: number;
  withinBudget: boolean;
}

/** Só faz sentido para instrumento com teto declarado — hoje, o A1. */
export function checkAtrito(code: FormInstrumentCode): AtritoCheck | null {
  const spec = INSTRUMENTS[code];
  if (spec.maxMinutes === null) return null;

  const estimatedMinutes = estimatedSeconds(spec) / 60;
  return {
    estimatedMinutes,
    maxMinutes: spec.maxMinutes,
    withinBudget: estimatedMinutes <= spec.maxMinutes,
  };
}
