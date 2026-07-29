import { Decimal } from "@prisma/client/runtime/client";

export { Decimal };

/** §6.1 — fixo no código, nunca tabela editável (§20). */
export type EntryNature = "RECEITA" | "DESPESA" | "INVESTIMENTO" | "OUTRO";

/** §6.3 */
export type EntryStatus =
  | "A_PAGAR"
  | "PAGO"
  | "A_RECEBER"
  | "RECEBIDO"
  | "ISENTO"
  | "AQUISICAO"
  | "ATUALIZACAO"
  | "ESTIMATIVA";

/** §6.4 — PATRIMONIO/PREVISAO da planilha viram flags (isPatrimonio/isProjecao), não valores aqui. */
export type RecurrenceKind =
  | "UNICA"
  | "VARIAVEL"
  | "MENSAL"
  | "BIMESTRAL"
  | "TRIMESTRAL"
  | "QUADRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL"
  | "BIENIO"
  | "TRIENIO"
  | "QUINQUENIO"
  | "DECENIO"
  | "VICENIO";

/**
 * Forma mínima de um lançamento para as regras puras de /lib/finance.
 * Não é o modelo `entry` do banco (que só existe a partir da Conversa 3) —
 * é só o que essas funções precisam para calcular.
 */
export interface FinanceEntry {
  id: string;
  walletId: string;
  categoryId: string;
  nature: EntryNature;
  /** Com sinal — despesa negativa, receita positiva (§8.3). */
  amount: Decimal;
  /** Compra — fato gerador. */
  transactionDate: Date;
  /** Vence — liquidação. */
  dueDate: Date;
  status: EntryStatus;
  recurrenceKind: RecurrenceKind;
  isFixedOverride?: boolean | null;
  groupId?: string | null;
}

export interface FinanceWallet {
  id: string;
  kindCode: string;
}

/** Regime de apuração (§10 R2). Default de todo relatório é "caixa". */
export type Regime = "caixa" | "competencia";

/** Intervalo de datas inclusivo dos dois lados, ignorando hora do dia. */
export interface Period {
  start: Date;
  end: Date;
}
