import { Decimal, type EntryStatus, type FinanceEntry, type FinanceWallet } from "./types";
import { isSameOrBefore } from "./dates";

/**
 * §11.1 — só o que já foi liquidado entra no saldo. Note que é um
 * subconjunto do "Ok" de derived.ts: AQUISICAO/ATUALIZACAO afetam
 * patrimônio (§7.4), não o saldo em dinheiro da carteira.
 */
export const SETTLED_FOR_BALANCE = new Set<EntryStatus>(["PAGO", "RECEBIDO", "ISENTO"]);

/**
 * saldo(carteira, data_corte) = Σ amount onde wallet_id = carteira,
 * status liquidado, due_date ≤ data_corte (§11.1).
 */
export function walletBalance(entries: FinanceEntry[], walletId: string, cutoffDate: Date): Decimal {
  return entries
    .filter(
      (e) => e.walletId === walletId && SETTLED_FOR_BALANCE.has(e.status) && isSameOrBefore(e.dueDate, cutoffDate),
    )
    .reduce((sum, e) => sum.plus(e.amount), new Decimal(0));
}

export interface DashboardBalanceBlocks {
  contas: Decimal;
  investimentos: Decimal;
  vouchers: Decimal;
  total: Decimal;
}

/**
 * §11.2 — os três blocos do dashboard da planilha e o total. Só essas
 * kinds entram no total; carteiras de outros tipos (cartão, físico,
 * pagamento, recebível) não fazem parte deste cálculo específico —
 * fiel ao dashboard original, não uma omissão.
 */
export function dashboardBalanceBlocks(
  entries: FinanceEntry[],
  wallets: FinanceWallet[],
  cutoffDate: Date,
): DashboardBalanceBlocks {
  const sumKinds = (kinds: string[]) =>
    wallets
      .filter((w) => kinds.includes(w.kindCode))
      .reduce((sum, w) => sum.plus(walletBalance(entries, w.id, cutoffDate)), new Decimal(0));

  const contas = sumKinds(["CONTA_BANCARIA"]);
  const investimentos = sumKinds(["CONTA_INVESTIMENTO", "CONTA_CAIXA"]);
  const vouchers = sumKinds(["VOUCHER"]);

  return { contas, investimentos, vouchers, total: contas.plus(investimentos).plus(vouchers) };
}
