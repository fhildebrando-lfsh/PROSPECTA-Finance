import { Decimal, type FinanceEntry, type FinanceWallet } from "@/lib/finance/types";
import { dashboardBalanceBlocks } from "@/lib/finance/balance";
import { periodTotals } from "@/lib/finance/period";
import { monthRange, isWithin } from "@/lib/finance/dates";
import { SETTLED_STATUSES } from "@/lib/finance/derived";
import { formatCurrencyBRL } from "@/lib/format";

/**
 * ARQUITETURA-METODO-PROSPECTAR.md §5.5, Etapa 6 — Assistente do Max: Q&A por
 * casamento de padrão sobre um catálogo pequeno e fixo de perguntas, nunca um
 * LLM de verdade (evita chave/custo de API externa não autorizada; um LLM real
 * é upgrade futuro isolado — só trocaria `matchIntent`, o resto do módulo já
 * fica pronto). Função pura: recebe dado já buscado, nunca toca no Prisma
 * (mesmo espírito de `lib/method/automation-engine.ts`).
 *
 * Regra dura, não opcional (§3.1 CVM, P2 da Metodologia): o assistente
 * **nunca recomenda produto ou ativo específico**. Qualquer pergunta que
 * pareça pedir isso ("em que eu invisto", "que ação comprar") é recusada
 * explicitamente, citando P2/P8, antes de qualquer tentativa de responder.
 */
export type AiIntent =
  | "SALDO_TOTAL"
  | "RECEITA_MES"
  | "GASTO_CATEGORIA_MES"
  | "RESERVA_RESTANTE"
  | "INCIDENTES_PENDENTES"
  | "RECOMENDACAO_RECUSADA"
  | "NAO_RECONHECIDA";

export interface AiAssistantCategory {
  id: string;
  name: string;
}

export interface AiAssistantGoal {
  targetAmount: Decimal;
  currentBalance: Decimal;
}

export interface AiAssistantContext {
  entries: FinanceEntry[];
  wallets: FinanceWallet[];
  categories: AiAssistantCategory[];
  openIncidentCount: number;
  /** Meta de reserva "fixada" pra este assistente responder — null = nenhuma cadastrada. */
  reserveGoal: AiAssistantGoal | null;
  today: Date;
}

export interface AiAnswer {
  intent: AiIntent;
  answerText: string;
  /** Rastro estruturado de como a resposta foi calculada — persistido em `AiInteraction.answerQuery`, nunca exposto como "fonte de verdade" alternativa. */
  answerQuery: Record<string, unknown> | null;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const RECOMMENDATION_KEYWORDS = [
  "em que eu invisto",
  "onde eu invisto",
  "onde investir",
  "que acao comprar",
  "qual acao comprar",
  "que fundo comprar",
  "qual fundo comprar",
  "vale a pena comprar",
  "devo comprar",
  "melhor investimento",
  "que criptomoeda",
  "qual criptomoeda",
];

function findCategoryInQuestion(categories: AiAssistantCategory[], normalizedQuestion: string): AiAssistantCategory | null {
  for (const category of categories) {
    const normalizedName = normalize(category.name);
    if (normalizedName.length > 0 && normalizedQuestion.includes(normalizedName)) return category;
  }
  return null;
}

export function answerQuestion(question: string, context: AiAssistantContext): AiAnswer {
  const q = normalize(question);

  if (RECOMMENDATION_KEYWORDS.some((keyword) => q.includes(keyword))) {
    return {
      intent: "RECOMENDACAO_RECUSADA",
      answerText:
        "Não posso recomendar um produto ou ativo específico — a PROSPECTA faz diagnóstico e organização, não indicação de investimento (isso é papel do profissional licenciado que você escolher). Posso te mostrar seus números (saldo, gasto por categoria, reserva) pra apoiar essa conversa.",
      answerQuery: null,
    };
  }

  if (q.includes("incidente")) {
    return {
      intent: "INCIDENTES_PENDENTES",
      answerText:
        context.openIncidentCount === 0
          ? "Você não tem nenhum incidente pendente de revisão."
          : `Você tem ${context.openIncidentCount} incidente(s) pendente(s) de revisão na fila de Compromissos → Incidentes.`,
      answerQuery: { openIncidentCount: context.openIncidentCount },
    };
  }

  if (q.includes("reserva") && (q.includes("falta") || q.includes("quanto"))) {
    if (!context.reserveGoal) {
      return {
        intent: "RESERVA_RESTANTE",
        answerText: "Você ainda não tem uma meta de reserva cadastrada em Patrimônio → Metas.",
        answerQuery: null,
      };
    }
    const rawMissing = context.reserveGoal.targetAmount.minus(context.reserveGoal.currentBalance);
    const missing = rawMissing.isNegative() ? new Decimal(0) : rawMissing;
    return {
      intent: "RESERVA_RESTANTE",
      answerText: missing.isZero()
        ? "Sua reserva já atingiu o valor-alvo."
        : `Faltam ${formatCurrencyBRL(missing)} para sua reserva chegar no valor-alvo.`,
      answerQuery: {
        targetAmount: context.reserveGoal.targetAmount.toString(),
        currentBalance: context.reserveGoal.currentBalance.toString(),
      },
    };
  }

  if (q.includes("saldo") || q.includes("quanto eu tenho") || q.includes("quanto tenho")) {
    const blocks = dashboardBalanceBlocks(context.entries, context.wallets, context.today);
    return {
      intent: "SALDO_TOTAL",
      answerText: `Seu saldo total hoje é ${formatCurrencyBRL(blocks.total)} (contas ${formatCurrencyBRL(blocks.contas)}, investimentos ${formatCurrencyBRL(blocks.investimentos)}, vouchers ${formatCurrencyBRL(blocks.vouchers)}).`,
      answerQuery: {
        total: blocks.total.toString(),
        contas: blocks.contas.toString(),
        investimentos: blocks.investimentos.toString(),
        vouchers: blocks.vouchers.toString(),
      },
    };
  }

  if (q.includes("recebi") || q.includes("receita") || q.includes("entrou")) {
    const period = monthRange(context.today.getUTCFullYear(), context.today.getUTCMonth());
    const totals = periodTotals(context.entries, period, "settled");
    return {
      intent: "RECEITA_MES",
      answerText: `Você já recebeu ${formatCurrencyBRL(totals.receita)} este mês.`,
      answerQuery: { receita: totals.receita.toString(), period },
    };
  }

  if (q.includes("gastei") || q.includes("gasto")) {
    const category = findCategoryInQuestion(context.categories, q);
    const period = monthRange(context.today.getUTCFullYear(), context.today.getUTCMonth());
    if (category) {
      const spent = context.entries
        .filter(
          (e) =>
            e.categoryId === category.id &&
            e.nature === "DESPESA" &&
            SETTLED_STATUSES.has(e.status) &&
            isWithin(e.dueDate, period.start, period.end),
        )
        .reduce((sum, e) => sum.plus(e.amount.abs()), new Decimal(0));
      return {
        intent: "GASTO_CATEGORIA_MES",
        answerText: `Você já gastou ${formatCurrencyBRL(spent)} em ${category.name} este mês.`,
        answerQuery: { categoryId: category.id, spent: spent.toString(), period },
      };
    }
    const totals = periodTotals(context.entries, period, "settled");
    return {
      intent: "GASTO_CATEGORIA_MES",
      answerText: `Você já gastou ${formatCurrencyBRL(totals.despesa.abs())} este mês, no total.`,
      answerQuery: { despesa: totals.despesa.toString(), period },
    };
  }

  return {
    intent: "NAO_RECONHECIDA",
    answerText:
      "Ainda não sei responder essa pergunta. Por enquanto posso te dizer: saldo total, quanto você recebeu ou gastou no mês (por categoria também), quanto falta pra sua reserva, e quantos incidentes estão pendentes.",
    answerQuery: null,
  };
}
