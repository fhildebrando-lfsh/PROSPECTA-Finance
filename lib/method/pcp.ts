import { Decimal } from "@/lib/finance/types";

/**
 * Etapa 15 — Plano de Continuidade Patrimonial (PCP, §12.1) e o **teste de
 * liquidez sucessória**. Puro.
 *
 * Não cria entidade nova: o checklist vive dentro do `Deliverable` de código
 * PCP, como o roadmap pede. O que este módulo define é o **conteúdo canônico**
 * do checklist e a matemática do teste — a persistência é a que já existe.
 */

export type ChecklistGroup = "DOCUMENTOS" | "ESTRUTURA" | "LIQUIDEZ" | "COMUNICACAO";

export const GROUP_LABELS: Record<ChecklistGroup, string> = {
  DOCUMENTOS: "Documentos",
  ESTRUTURA: "Estrutura patrimonial",
  LIQUIDEZ: "Liquidez",
  COMUNICACAO: "Comunicação",
};

export interface ChecklistItem {
  key: string;
  group: ChecklistGroup;
  label: string;
  /** Por que este item existe — a tela mostra, para não virar burocracia. */
  porque: string;
}

/**
 * O checklist sucessório.
 *
 * Agrupado em quatro frentes porque falham por motivos diferentes: documento
 * que não existe, estrutura que force inventário caro, falta de dinheiro na
 * hora, e — a que mais custa e menos aparece — família que não sabe de nada.
 *
 * As chaves são estáveis: viram índice dentro do `Deliverable`, e renomear
 * tornaria ilegível um PCP já entregue.
 */
export const CHECKLIST_PCP: ChecklistItem[] = [
  {
    key: "testamento",
    group: "DOCUMENTOS",
    label: "Existe testamento ou declaração de última vontade?",
    porque: "Sem ele, a partilha segue a lei — que raramente coincide com o que a pessoa gostaria.",
  },
  {
    key: "inventario_documentos",
    group: "DOCUMENTOS",
    label: "Os documentos dos bens estão localizáveis por terceiros?",
    porque: "Matrícula, contrato e apólice que só o titular sabe onde estão viram meses de atraso no inventário.",
  },
  {
    key: "beneficiarios_atualizados",
    group: "DOCUMENTOS",
    label: "Os beneficiários de seguros e previdência estão atualizados?",
    porque: "Beneficiário desatualizado é o erro mais comum e o mais fácil de corrigir — e não passa por inventário.",
  },
  {
    key: "procuracao",
    group: "DOCUMENTOS",
    label: "Há procuração ou diretiva para incapacidade temporária?",
    porque: "Sucessão trata da morte; incapacidade acontece antes e trava as contas do mesmo jeito.",
  },
  {
    key: "regime_bens",
    group: "ESTRUTURA",
    label: "O regime de bens está claro e é o desejado?",
    porque: "É o que define o que sequer entra na partilha.",
  },
  {
    key: "holding_ou_doacao",
    group: "ESTRUTURA",
    label: "A estrutura societária ou de doação em vida foi avaliada?",
    porque: "Avaliada, não necessariamente feita — estrutura errada custa mais que o inventário que ela evitaria.",
  },
  {
    key: "bens_no_exterior",
    group: "ESTRUTURA",
    label: "Há bens no exterior mapeados e com regra de sucessão conhecida?",
    porque: "Bem fora do país segue a lei de lá, e costuma exigir processo próprio.",
  },
  {
    key: "liquidez_para_custos",
    group: "LIQUIDEZ",
    label: "Existe liquidez suficiente para impostos e custas, sem vender bens?",
    porque: "É o teste abaixo. Sem caixa, a família vende com pressa e desconto.",
  },
  {
    key: "seguro_para_sucessao",
    group: "LIQUIDEZ",
    label: "Há seguro de vida dimensionado para cobrir o custo sucessório?",
    porque: "Seguro de vida não entra em inventário e chega antes dele — é a ferramenta clássica para este custo.",
  },
  {
    key: "familia_informada",
    group: "COMUNICACAO",
    label: "A família sabe o que existe e onde encontrar?",
    porque: "Patrimônio que ninguém conhece é patrimônio que se perde — e é a falha mais cara e menos visível.",
  },
  {
    key: "responsavel_designado",
    group: "COMUNICACAO",
    label: "Há alguém designado para conduzir o processo?",
    porque: "Sem responsável claro, a decisão trava no pior momento possível.",
  },
];

export type ChecklistState = Record<string, boolean>;

export interface ChecklistProgress {
  concluidos: number;
  total: number;
  /** §5.3.1 — alimenta o indicador Continuidade do PSF. */
  percentual: number;
  pendentes: ChecklistItem[];
}

/**
 * Item desconhecido no estado gravado é **ignorado**, e item novo do catálogo
 * conta como pendente. É o que permite acrescentar uma pergunta ao checklist
 * sem corromper um PCP antigo: ele simplesmente passa a ter um pendente a mais.
 */
export function checklistProgress(state: ChecklistState): ChecklistProgress {
  const pendentes = CHECKLIST_PCP.filter((i) => state[i.key] !== true);
  const concluidos = CHECKLIST_PCP.length - pendentes.length;
  return {
    concluidos,
    total: CHECKLIST_PCP.length,
    percentual: CHECKLIST_PCP.length === 0 ? 0 : (concluidos / CHECKLIST_PCP.length) * 100,
    pendentes,
  };
}

// --- Teste de liquidez sucessória -------------------------------------------

export interface LiquidityTestInput {
  /** Patrimônio que passa por inventário. */
  patrimonioInventariavel: Decimal;
  /** Dinheiro que a família alcança rápido, sem vender bem. */
  liquidezDisponivel: Decimal;
  /** Capital de seguro de vida — não entra em inventário e chega antes dele. */
  seguroDeVida: Decimal;
}

/**
 * Alíquotas e custos, **editáveis por serem regionais**.
 *
 * O ITCMD é estadual e varia de 2% a 8%; 4% é a alíquota de São Paulo, usada
 * como partida. **Não é uma afirmação sobre o caso do cliente** — a Metodologia
 * deixa ITCMD/SP como pendência jurídica (#15), e o número certo depende do
 * estado e da faixa. Por isso é parâmetro, não constante escondida.
 */
export const ITCMD_PADRAO_PCT = 4;

/** Custas, honorários e emolumentos de inventário, como % do espólio. */
export const CUSTO_INVENTARIO_PADRAO_PCT = 6;

export interface LiquidityTestResult {
  custoItcmd: Decimal;
  custoInventario: Decimal;
  custoTotal: Decimal;
  /** Liquidez própria + seguro. */
  recursosDisponiveis: Decimal;
  /** Positivo = falta dinheiro. */
  deficit: Decimal;
  aprovado: boolean;
  /** Quanto do patrimônio precisaria ser vendido às pressas para cobrir. */
  percentualDoPatrimonioAVender: number;
  explicacao: string;
}

export function successionLiquidityTest(
  input: LiquidityTestInput,
  itcmdPct: number = ITCMD_PADRAO_PCT,
  inventarioPct: number = CUSTO_INVENTARIO_PADRAO_PCT,
): LiquidityTestResult {
  const zero = new Decimal(0);
  const base = input.patrimonioInventariavel.isNegative() ? zero : input.patrimonioInventariavel;

  const custoItcmd = base.times(itcmdPct).dividedBy(100);
  const custoInventario = base.times(inventarioPct).dividedBy(100);
  const custoTotal = custoItcmd.plus(custoInventario);

  const recursosDisponiveis = input.liquidezDisponivel.plus(input.seguroDeVida);
  const bruto = custoTotal.minus(recursosDisponiveis);
  const deficit = bruto.isNegative() ? zero : bruto;
  const aprovado = deficit.lessThanOrEqualTo(0);

  const percentualDoPatrimonioAVender = base.lessThanOrEqualTo(0)
    ? 0
    : deficit.dividedBy(base).times(100).toNumber();

  const explicacao = aprovado
    ? "Há recursos suficientes para impostos e custas sem precisar vender bens com pressa."
    : `Faltariam ${deficit.toFixed(2)} — a família precisaria vender cerca de ${percentualDoPatrimonioAVender.toFixed(1)}% do patrimônio às pressas, geralmente com desconto.`;

  return {
    custoItcmd,
    custoInventario,
    custoTotal,
    recursosDisponiveis,
    deficit,
    aprovado,
    percentualDoPatrimonioAVender,
    explicacao,
  };
}
