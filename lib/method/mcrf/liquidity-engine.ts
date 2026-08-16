import { Decimal } from "@/lib/finance/types";
import type { FuncaoPatrimonial } from "@/app/generated/prisma/enums";

/**
 * §29 e §30 da especificação PROSPECTA-MCRF — classificação de liquidez e
 * **valor elegível para reserva**. Puro: recebe valores já calculados por
 * `lib/finance/`, nunca recalcula patrimônio nem toca no Prisma.
 *
 * A premissa que este arquivo existe para aplicar (§29): **nem todo patrimônio
 * é reserva.** Um imóvel de R$ 500.000 não paga o aluguel do mês que vem, e o
 * limite do cartão não é dinheiro — é dívida esperando acontecer.
 *
 * **Reuso importante:** a classificação de liquidez já existia no sistema com
 * outro nome. `funcaoPatrimonial` (Etapa 7) responde "para que serve esta
 * peça", e é exatamente o que §29 pede. O que parecia uma tela de classificação
 * era a fundação deste motor.
 */
export type ClasseLiquidez =
  /** §29.1 — acesso rápido, baixo risco. */
  | "IMEDIATA"
  /** §29.2 — poucos dias, alguma restrição ou oscilação. */
  | "SECUNDARIA"
  /** Uso restrito: existe, mas não paga qualquer conta (vale-refeição). */
  | "RESTRITA"
  /** §29.3 — comprometido com outro objetivo; usar tem custo real. */
  | "ESTRATEGICO"
  /** §29.4 — imóvel, veículo, bem físico. */
  | "ILIQUIDO"
  /** §29.5 — cartão, cheque especial, linha de crédito. Nunca é reserva. */
  | "CREDITO";

export interface LiquidityFactors {
  /** Quão rápido o recurso vira dinheiro na conta. */
  liquidez: number;
  /** Quanto o valor oscila — o que vale hoje ainda vale na emergência? */
  estabilidade: number;
  /** Está livre, ou comprometido com outro objetivo? */
  disponibilidade: number;
}

/**
 * §30 — os três fatores por classe.
 *
 * **Correção deliberada do modelo da especificação** (registrada na análise da
 * Etapa 9-A, divergência 2): §30 propõe `valor × liquidez × estabilidade ×
 * disponibilidade`, mas três fatores de 0,8 dão 0,51 — metade da elegibilidade
 * evaporaria num ativo apenas levemente restrito, sem justificativa financeira.
 * A composição aqui é multiplicativa (é explicável, como §30 quer) **com piso
 * no pior fator isolado**: o resultado nunca é pior do que a maior restrição
 * sozinha já implicaria. Ver `eligibilityFactor()`.
 */
const FATORES: Record<ClasseLiquidez, LiquidityFactors> = {
  IMEDIATA: { liquidez: 1, estabilidade: 1, disponibilidade: 1 },
  SECUNDARIA: { liquidez: 0.9, estabilidade: 0.85, disponibilidade: 1 },
  RESTRITA: { liquidez: 0.5, estabilidade: 1, disponibilidade: 0.5 },
  ESTRATEGICO: { liquidez: 1, estabilidade: 0.9, disponibilidade: 0.2 },
  // Ilíquido é exibido em separado (§55 exige), mas não conta como reserva:
  // ninguém paga a conta do mês que vem com o próprio imóvel.
  ILIQUIDO: { liquidez: 0, estabilidade: 0.8, disponibilidade: 0 },
  // §29.5 — crédito é dívida esperando acontecer, não liquidez.
  CREDITO: { liquidez: 0, estabilidade: 0, disponibilidade: 0 },
};

/**
 * Composição dos três fatores com piso no pior deles. Ver comentário de
 * `FATORES` para o porquê de não ser o produto puro.
 */
export function eligibilityFactor(f: LiquidityFactors): number {
  const produto = f.liquidez * f.estabilidade * f.disponibilidade;
  const pior = Math.min(f.liquidez, f.estabilidade, f.disponibilidade);
  return Math.max(produto, pior);
}

/**
 * Traduz o que o sistema já sabe sobre uma peça de patrimônio na sua classe de
 * liquidez.
 *
 * `isLiability` vem de `WalletKind` e tem precedência sobre tudo: cartão de
 * crédito classificado como PROTECAO por engano continua sendo crédito.
 *
 * Sem `funcaoPatrimonial`, cai no tipo da carteira — e na ausência dos dois,
 * assume `ESTRATEGICO` (elegibilidade baixa). É a escolha conservadora: contar
 * como imediato um recurso que ninguém classificou inflaria a reserva
 * disponível e faria a pessoa se achar mais protegida do que está.
 */
export function classifyLiquidity(input: {
  funcao: FuncaoPatrimonial | null;
  walletKindCode?: string | null;
  isLiability?: boolean;
  isPhysicalAsset?: boolean;
}): ClasseLiquidez {
  if (input.isLiability) return "CREDITO";
  if (input.isPhysicalAsset) return "ILIQUIDO";

  switch (input.funcao) {
    case "PROTECAO":
    case "LIQUIDEZ_OPERACIONAL":
      return "IMEDIATA";
    case "CRESCIMENTO":
      return "SECUNDARIA";
    case "OBJETIVOS":
    case "LONGEVIDADE":
      return "ESTRATEGICO";
    case "USO":
    case "SUCESSAO":
      return "ILIQUIDO";
    default:
      break;
  }

  switch (input.walletKindCode) {
    case "CONTA_BANCARIA":
    case "CONTA_CAIXA":
    case "CONTA_PAGAMENTO":
    case "CARTEIRA_FISICA":
      return "IMEDIATA";
    case "CONTA_INVESTIMENTO":
      return "SECUNDARIA";
    case "VOUCHER":
      return "RESTRITA";
    case "CONTA_RECEBIVEL":
      // Empréstimo a terceiro: não dá para exigir de volta numa emergência.
      return "ILIQUIDO";
    default:
      return "ESTRATEGICO";
  }
}

export interface LiquidityItem {
  id: string;
  name: string;
  value: Decimal;
  classe: ClasseLiquidez;
}

export interface EmergencyLiquidity {
  /** §30 — soma de valor × fator de elegibilidade. É a "reserva atual" de verdade. */
  eligibleValue: Decimal;
  /** Total bruto, sem fator. A diferença entre os dois é o que a pessoa acha que tem e não tem. */
  grossValue: Decimal;
  porClasse: { classe: ClasseLiquidez; total: Decimal; eligible: Decimal; itemCount: number }[];
  /** Exibido em separado por exigência de §55 — nunca somado à reserva. */
  creditoDisponivel: Decimal;
}

const CLASSES: ClasseLiquidez[] = ["IMEDIATA", "SECUNDARIA", "RESTRITA", "ESTRATEGICO", "ILIQUIDO", "CREDITO"];

/**
 * §30 — quanto do patrimônio realmente serve de reserva de emergência.
 *
 * Valor negativo (conta no cheque especial) entra como está no bruto e **não**
 * é elegível — dívida não vira reserva ao ser multiplicada por um fator.
 */
export function computeEmergencyLiquidity(items: LiquidityItem[]): EmergencyLiquidity {
  const zero = new Decimal(0);

  const porClasse = CLASSES.map((classe) => {
    const doGrupo = items.filter((i) => i.classe === classe);
    const total = doGrupo.reduce((sum, i) => sum.plus(i.value), zero);
    const fator = eligibilityFactor(FATORES[classe]);
    const eligible = doGrupo
      .filter((i) => i.value.greaterThan(0))
      .reduce((sum, i) => sum.plus(i.value.times(fator)), zero);
    return { classe, total, eligible, itemCount: doGrupo.length };
  });

  return {
    eligibleValue: porClasse.reduce((sum, c) => sum.plus(c.eligible), zero),
    grossValue: items.reduce((sum, i) => sum.plus(i.value), zero),
    porClasse,
    creditoDisponivel: porClasse.find((c) => c.classe === "CREDITO")?.total ?? zero,
  };
}

/**
 * §38.1 — Cobertura matemática: quantos meses do custo essencial a reserva
 * elegível cobre. É a leitura simples; §38.2 (cobertura no cenário) tem mais
 * relevância analítica e chega na 9-A.4.
 */
export function coberturaEmMeses(eligibleValue: Decimal, cema: Decimal): number | null {
  if (cema.lessThanOrEqualTo(0)) return null;
  return eligibleValue.div(cema).toNumber();
}
