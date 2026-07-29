import { Decimal, type EntryNature } from "./types";

export interface TransferInput {
  fromWalletId: string;
  toWalletId: string;
  /** Valor absoluto (positivo) da transferência. */
  amount: Decimal;
  transferId: string;
  categoryId: string;
  transactionDate: Date;
  dueDate: Date;
}

export interface TransferLine {
  walletId: string;
  amount: Decimal;
  nature: EntryNature;
  categoryId: string;
  transferId: string;
  transactionDate: Date;
  dueDate: Date;
}

/**
 * §10 R5 — uma transferência é duas linhas que nascem e morrem juntas:
 * saída negativa na carteira de origem, entrada positiva na de destino,
 * mesmo transferId, nature = OUTRO (fica fora de RECEITA/DESPESA/
 * INVESTIMENTO por construção — nenhum filtro adicional necessário).
 *
 * A atomicidade real (as duas linhas na mesma transação de banco) é
 * responsabilidade da camada de API (Conversa 3) — esta função só monta
 * o par e garante que a soma é sempre zero.
 */
export function createTransferPair(input: TransferInput): [TransferLine, TransferLine] {
  if (input.amount.lte(0)) {
    throw new Error("Valor da transferência precisa ser positivo.");
  }

  const shared = {
    nature: "OUTRO" as const,
    categoryId: input.categoryId,
    transferId: input.transferId,
    transactionDate: input.transactionDate,
    dueDate: input.dueDate,
  };

  const outLine: TransferLine = { ...shared, walletId: input.fromWalletId, amount: input.amount.negated() };
  const inLine: TransferLine = { ...shared, walletId: input.toWalletId, amount: input.amount };

  return [outLine, inLine];
}
