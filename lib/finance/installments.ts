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
