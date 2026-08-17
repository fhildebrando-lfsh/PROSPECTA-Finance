import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL } from "@/lib/format";
import type { AssessmentOverrides } from "./run-assessment";

/**
 * §43 — o simulador "E se?" da tela da Reserva.
 *
 * As hipóteses trafegam na **query string**, e não em estado de cliente nem em
 * banco: simulação não é dado do cliente e §43 é explícito em que nada aqui é
 * gravado. Como efeito colateral útil, uma simulação vira um link — o consultor
 * consegue mandar "veja o que acontece se você quitar esta dívida" para o
 * cliente sem alterar nada na conta dele.
 *
 * Este módulo é **puro** e só traduz texto de URL em `AssessmentOverrides`. Quem
 * roda o cálculo é `runAssessment`, que já sabe aplicar cada hipótese na ordem
 * certa (depois de ler o dado real, antes de rodar os cenários) — por isso tudo
 * a jusante recalcula sozinho e de forma coerente.
 */
export interface SimulationParams {
  /** Redução do custo mensal, em pontos percentuais: "10" = 10% mais barato. */
  custoPct?: string;
  rendaExtra?: string;
  dividaQuitada?: string;
  liquidezExtra?: string;
  /** "1" liga a hipótese. */
  segundaAtividade?: string;
  seguroRenda?: string;
}

export interface ParsedSimulation {
  overrides: AssessmentOverrides;
  /** O que foi hipotetizado, em frases — a tela mostra para não haver dúvida do que mudou. */
  hipoteses: string[];
  /**
   * O que foi descartado e por quê. Um simulador que ignora entrada inválida em
   * silêncio faz o usuário concluir que a hipótese não teve efeito, quando na
   * verdade ela nem foi aplicada.
   */
  ignorados: string[];
  /** Falso quando nenhuma hipótese válida veio na URL — a tela não simula à toa. */
  ativo: boolean;
}

/**
 * Aceita "1234.56" e "1234,56": o usuário digita como fala, e um campo numérico
 * em pt-BR pode chegar dos dois jeitos dependendo do navegador.
 */
function parseNumero(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const limpo = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

function parseDinheiro(
  raw: string | undefined,
  rotulo: string,
  hipoteses: string[],
  ignorados: string[],
  frase: (valor: string) => string,
): Decimal | undefined {
  const n = parseNumero(raw);
  if (n === null) {
    if (raw !== undefined && raw.trim() !== "") ignorados.push(`${rotulo}: "${raw}" não é um valor válido.`);
    return undefined;
  }
  if (n < 0) {
    ignorados.push(`${rotulo}: valor negativo não faz sentido aqui e foi ignorado.`);
    return undefined;
  }
  // Zero é entrada legítima ("e se eu não tivesse nada disso?") mas equivale ao
  // cálculo real — não vira hipótese, para não poluir a lista com nada.
  if (n === 0) return undefined;

  const d = new Decimal(n);
  hipoteses.push(frase(formatCurrencyBRL(d)));
  return d;
}

export function parseSimulation(params: SimulationParams): ParsedSimulation {
  const overrides: AssessmentOverrides = {};
  const hipoteses: string[] = [];
  const ignorados: string[] = [];

  const pct = parseNumero(params.custoPct);
  if (pct !== null) {
    if (pct < 0 || pct > 100) {
      ignorados.push("Redução de custo: só faz sentido entre 0% e 100%.");
    } else if (pct > 0) {
      overrides.reducaoCustoPct = pct / 100;
      hipoteses.push(`Seu custo mensal cai ${pct}%.`);
    }
  } else if (params.custoPct !== undefined && params.custoPct.trim() !== "") {
    ignorados.push(`Redução de custo: "${params.custoPct}" não é um número.`);
  }

  overrides.rendaExtraMensal = parseDinheiro(
    params.rendaExtra,
    "Renda extra",
    hipoteses,
    ignorados,
    (v) => `Entra ${v} de renda por mês.`,
  );

  overrides.dividaQuitadaMensal = parseDinheiro(
    params.dividaQuitada,
    "Dívida quitada",
    hipoteses,
    ignorados,
    (v) => `Você quita uma dívida que consome ${v} por mês.`,
  );

  overrides.liquidezExtra = parseDinheiro(
    params.liquidezExtra,
    "Liquidez extra",
    hipoteses,
    ignorados,
    (v) => `Você acrescenta ${v} de liquidez disponível.`,
  );

  if (params.segundaAtividade === "1") {
    overrides.forcarSegundaAtividadeResiliente = true;
    hipoteses.push("Sua atividade alternativa passa a gerar renda de verdade.");
  }

  if (params.seguroRenda === "1") {
    overrides.contratarSeguro = true;
    hipoteses.push("Você contrata proteção para o risco principal hoje descoberto.");
  }

  // Chaves com `undefined` são removidas para o objeto de hipóteses refletir
  // exatamente o que foi pedido — facilita ler o que está sendo simulado.
  for (const k of Object.keys(overrides) as (keyof AssessmentOverrides)[]) {
    if (overrides[k] === undefined) delete overrides[k];
  }

  return { overrides, hipoteses, ignorados, ativo: hipoteses.length > 0 };
}

/**
 * A diferença entre o cálculo real e o simulado, já com o sinal interpretado.
 * `melhor` é o que a tela usa para colorir: **reserva menor é melhora**, porque
 * significa precisar de menos caixa para o mesmo grau de proteção.
 */
export interface Delta {
  diferenca: Decimal;
  melhor: boolean;
  igual: boolean;
}

export function deltaReserva(real: Decimal, simulado: Decimal): Delta {
  const diferenca = simulado.minus(real);
  return { diferenca, melhor: diferenca.isNegative(), igual: diferenca.isZero() };
}

/** Para progresso e cobertura vale o inverso: maior é melhor. */
export function deltaCobertura(real: number, simulado: number): Delta {
  const diferenca = new Decimal(simulado - real);
  return { diferenca, melhor: diferenca.greaterThan(0), igual: diferenca.isZero() };
}
