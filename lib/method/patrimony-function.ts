import { Decimal } from "@/lib/finance/types";
import type { FuncaoPatrimonial } from "@/app/generated/prisma/enums";

/**
 * §13.4 da Metodologia PROSPECTA v5.0 (ARQUITETURA-METODO-PROSPECTAR.md §5.1,
 * Etapa 7) — Mapa Funcional do Patrimônio, camada de classificação. Puro:
 * recebe os valores já calculados pelo chamador (`assetCurrentValue`,
 * `investmentPositionValue`, `walletBalance` — todas de `lib/finance/`) e só
 * agrupa. Nunca recalcula valor de nada: valor de patrimônio tem uma fonte de
 * verdade só, e ela já existe.
 *
 * Escopo desta etapa é **classificar e apontar o que falta classificar**, não
 * emitir diagnóstico ou recomendação sobre a distribuição encontrada — isso é
 * o MFP completo (`mfp_diagnostico`, feature de método, Etapa 14), que exige
 * consultor ativo. A diferença não é de tamanho, é de natureza: dizer "40% do
 * seu patrimônio está em USO" é informação; dizer se isso está certo é
 * aconselhamento (§3.1/P2).
 */
export type PatrimonyItemKind = "BEM" | "INVESTIMENTO" | "CARTEIRA";

export interface PatrimonyItem {
  id: string;
  kind: PatrimonyItemKind;
  name: string;
  /** Já calculado pelo chamador a partir de `lib/finance/` — nunca derivado aqui. */
  value: Decimal;
  funcao: FuncaoPatrimonial | null;
}

export interface PatrimonyAssetInput {
  id: string;
  name: string;
  /** `assetCurrentValue(...)`, já calculado pelo chamador. */
  value: Decimal;
  funcao: FuncaoPatrimonial | null;
}

export interface PatrimonyInvestmentInput {
  id: string;
  name: string;
  /** Carteira que abriga a posição — a chave do desconto de dupla contagem. */
  walletId: string;
  /** `investmentPositionValue(...)`, já calculado pelo chamador. */
  value: Decimal;
  funcao: FuncaoPatrimonial | null;
}

export interface PatrimonyWalletInput {
  id: string;
  name: string;
  /** `walletBalance(...)` cru, sem nenhum desconto — quem desconta é esta função. */
  balance: Decimal;
  funcao: FuncaoPatrimonial | null;
}

/**
 * Monta a lista de itens do mapa a partir das três origens, **descontando do
 * saldo de cada carteira as posições que ela abriga**.
 *
 * Por que o desconto existe (achado de revisão, 2026-08-15): somar saldo de
 * carteira + posições parecia seguro porque lançamento de patrimônio usa
 * AQUISICAO/ATUALIZACAO, fora de `SETTLED_FOR_BALANCE`
 * (`lib/finance/balance.ts`). Isso vale **por lançamento**, mas não no
 * agregado — o dinheiro chega na carteira de investimento por uma
 * transferência comum (as duas pernas nascem `PAGO`, ver
 * `lib/entries/transfer.ts`), entra no saldo e nunca sai: comprar a posição
 * não debita o caixa. Sem desconto, R$ 10.000 viravam R$ 20.000 no total.
 *
 * Saldo − posições abrigadas é exatamente o caixa ainda não alocado
 * (transferiu 15k, comprou 10k → 5k parados). Piso em zero para o caso de uma
 * posição cadastrada sem transferência correspondente (registrar um CDB que já
 * existia): ali o saldo é 0 e a subtração daria um negativo fantasma.
 *
 * Esta função vive aqui, e não na página, de propósito: foi justamente a
 * duplicação desse cálculo entre tela e teste que deixou a dupla contagem
 * passar batido na primeira versão.
 */
export function buildPatrimonyItems(input: {
  assets: PatrimonyAssetInput[];
  investments: PatrimonyInvestmentInput[];
  wallets: PatrimonyWalletInput[];
}): PatrimonyItem[] {
  const hostedByWallet = new Map<string, Decimal>();
  for (const i of input.investments) {
    const current = hostedByWallet.get(i.walletId) ?? new Decimal(0);
    hostedByWallet.set(i.walletId, current.plus(i.value));
  }

  return [
    ...input.assets.map((a) => ({
      id: a.id,
      kind: "BEM" as const,
      name: a.name,
      value: a.value,
      funcao: a.funcao,
    })),
    ...input.investments.map((i) => ({
      id: i.id,
      kind: "INVESTIMENTO" as const,
      name: i.name,
      value: i.value,
      funcao: i.funcao,
    })),
    ...input.wallets.map((w) => {
      const hosted = hostedByWallet.get(w.id);
      const value = hosted ? w.balance.minus(hosted) : w.balance;
      return {
        id: w.id,
        kind: "CARTEIRA" as const,
        name: w.name,
        value: hosted && value.isNegative() ? new Decimal(0) : value,
        funcao: w.funcao,
      };
    }),
  ];
}

export const FUNCOES: FuncaoPatrimonial[] = [
  "PROTECAO",
  "LIQUIDEZ_OPERACIONAL",
  "OBJETIVOS",
  "LONGEVIDADE",
  "CRESCIMENTO",
  "USO",
  "SUCESSAO",
];

export interface FunctionSlice {
  funcao: FuncaoPatrimonial;
  total: Decimal;
  /** Percentual do patrimônio classificado + não classificado (o total geral). */
  percent: number;
  itemCount: number;
}

export interface PatrimonyFunctionMap {
  slices: FunctionSlice[];
  /** Soma dos itens sem função definida — sempre exibido em separado, nunca diluído nas 7 fatias (mesmo princípio do "não alocado" da Régua e do "não avaliado" do PSF). */
  semFuncao: Decimal;
  semFuncaoPercent: number;
  semFuncaoCount: number;
  total: Decimal;
}

/**
 * `lessThanOrEqualTo(0)`, não `isZero()` — mesma guarda de
 * `lib/method/allocation.ts::percentOfIncome` e dos indicadores de
 * `lib/method/psf.ts`. Com denominador negativo (patrimônio total negativo:
 * conta no cheque especial maior que o resto), a divisão inverteria o sinal
 * de todo percentual — uma fatia positiva apareceria como "-33%" e a negativa
 * como "133%". Percentual de um total que não é positivo não tem significado;
 * devolver 0 aqui é o que faz a tela cair no mesmo tratamento de "sem base
 * para calcular" que ela já dá ao patrimônio zerado.
 */
function percentOf(part: Decimal, whole: Decimal): number {
  if (whole.lessThanOrEqualTo(0)) return 0;
  return part.div(whole).times(100).toNumber();
}

/**
 * Distribuição do patrimônio pelas 7 funções + o bloco "sem função". Itens de
 * valor negativo ou zero entram na soma como estão (um bem depreciado a zero
 * continua sendo um bem) — filtrar valor é decisão do chamador, não desta
 * função.
 */
export function computeFunctionMap(items: PatrimonyItem[]): PatrimonyFunctionMap {
  const total = items.reduce((sum, i) => sum.plus(i.value), new Decimal(0));

  const slices = FUNCOES.map((funcao) => {
    const matching = items.filter((i) => i.funcao === funcao);
    const sliceTotal = matching.reduce((sum, i) => sum.plus(i.value), new Decimal(0));
    return { funcao, total: sliceTotal, percent: percentOf(sliceTotal, total), itemCount: matching.length };
  });

  const unclassified = items.filter((i) => i.funcao === null);
  const semFuncao = unclassified.reduce((sum, i) => sum.plus(i.value), new Decimal(0));

  return {
    slices,
    semFuncao,
    semFuncaoPercent: percentOf(semFuncao, total),
    semFuncaoCount: unclassified.length,
    total,
  };
}

/**
 * O "achado automático" de §13.4 — o que ainda não tem função definida,
 * maior valor primeiro (o que mais pesa no patrimônio é o que mais importa
 * classificar). Só itens com valor positivo: um bem já baixado a zero, ou uma
 * carteira zerada, não é um achado acionável — apontá-lo seria ruído numa
 * lista cujo propósito é dizer "olhe para isto".
 */
export function unclassifiedFindings(items: PatrimonyItem[]): PatrimonyItem[] {
  return items
    .filter((i) => i.funcao === null && i.value.greaterThan(0))
    .sort((a, b) => b.value.comparedTo(a.value));
}
