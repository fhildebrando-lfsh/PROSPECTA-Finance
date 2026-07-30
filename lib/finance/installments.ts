import { Decimal } from "./types";
import { addMonths } from "./dates";

export interface InstallmentPlan {
  totalInstallments: number;
  firstDueDate: Date;
  /** Compra — idêntica em todas as parcelas (§8.5). */
  transactionDate: Date;
  /** Valor de cada parcela, com sinal. */
  amount: Decimal;
  groupId: string;
}

export interface GeneratedInstallment {
  groupId: string;
  installmentNumber: number;
  installmentTotal: number;
  transactionDate: Date;
  dueDate: Date;
  amount: Decimal;
}

/**
 * §8.5 — gera N lançamentos com o mesmo group_id, installment_number de
 * 1 a N, due_date avançando mês a mês a partir da primeira parcela, e
 * transaction_date idêntica em todas (o padrão observado nos
 * financiamentos da planilha).
 *
 * Cada due_date é recalculado a partir do dia original da primeira parcela
 * (não em cadeia a partir da parcela anterior), para que um vencimento no
 * dia 31 volte a cair no dia 31 assim que o mês seguinte permitir, em vez
 * de ficar preso em 28 só porque fevereiro não tem esse dia.
 */
export function generateInstallments(plan: InstallmentPlan): GeneratedInstallment[] {
  if (plan.totalInstallments < 1) {
    throw new Error("totalInstallments precisa ser >= 1");
  }

  return Array.from({ length: plan.totalInstallments }, (_, i) => ({
    groupId: plan.groupId,
    installmentNumber: i + 1,
    installmentTotal: plan.totalInstallments,
    transactionDate: plan.transactionDate,
    dueDate: addMonths(plan.firstDueDate, i),
    amount: plan.amount,
  }));
}

export interface RecurrencePlan {
  firstDueDate: Date;
  transactionDate: Date;
  amount: Decimal;
  groupId: string;
  /** de RecurrenceKind.intervalMonths — 1 para Mensal, 2 para Bimestral, etc. */
  intervalMonths: number;
  /** §8.5 — decisão do produto: materializar 24 meses à frente. */
  monthsAhead?: number;
}

export interface GeneratedRecurrence {
  groupId: string;
  transactionDate: Date;
  dueDate: Date;
  amount: Decimal;
}

/**
 * §8.5 — para recorrências sem fim (Mensal, Bimestral...), a decisão foi
 * materializar 24 meses à frente em vez de gerar ocorrências virtuais na
 * leitura. Esta função gera essas ocorrências; o job mensal que estende a
 * janela (chamando de novo a partir da última ocorrência existente) é
 * responsabilidade de quem chama, não desta função pura.
 */
export function generateRecurrenceOccurrences(plan: RecurrencePlan): GeneratedRecurrence[] {
  if (plan.intervalMonths < 1) {
    throw new Error("intervalMonths precisa ser >= 1");
  }

  const monthsAhead = plan.monthsAhead ?? 24;
  const count = Math.floor(monthsAhead / plan.intervalMonths) + 1;

  return Array.from({ length: count }, (_, i) => ({
    groupId: plan.groupId,
    transactionDate: plan.transactionDate,
    dueDate: addMonths(plan.firstDueDate, i * plan.intervalMonths),
    amount: plan.amount,
  }));
}
