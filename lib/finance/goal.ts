import { Decimal } from "./types";

/**
 * Progresso de uma meta (Fase 3, §7.4 "Sonhos_Metas") — percentual do saldo
 * real da caixinha em relação ao valor-alvo. É a única fonte de verdade do
 * progresso de uma `Goal`, usada tanto em Patrimônio → Metas quanto na seção
 * "Metas" do Painel (`Goal.pinnedToPainel`) — nunca um cálculo paralelo.
 * `walletBalance` vem de `lib/finance/balance.ts::walletBalance`, já
 * existente — esta função não recalcula saldo, só a razão contra o alvo.
 */
export function goalProgress(walletBalance: Decimal, targetAmount: Decimal): Decimal {
  if (targetAmount.isZero() || targetAmount.isNegative()) return new Decimal(0);
  return walletBalance.div(targetAmount).times(100);
}
