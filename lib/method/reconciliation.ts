import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { walletBalance } from "@/lib/finance/balance";
import { Decimal } from "@/lib/finance/types";

/**
 * §13.6 (ARQUITETURA-METODO-PROSPECTAR.md §5.6, Etapa 2) — registra "quanto
 * o cliente diz que a carteira tem" contra "quanto o sistema calcula que ela
 * tem" no momento da checagem. Recalcula o saldo do sistema aqui mesmo (não
 * confia em nenhum valor vindo do formulário além do declarado) — mesmo
 * princípio de nunca confiar em dado do cliente pra decisão de servidor já
 * usado em toda a aplicação.
 */
export async function reconcileWalletBalance(params: {
  workspaceId: string;
  walletId: string;
  declaredBalance: string;
  checkedBy: string;
}) {
  const wallet = await prisma.wallet.findFirst({
    where: { id: params.walletId, workspaceId: params.workspaceId },
  });
  if (!wallet) throw new ApiError(404, "Carteira não encontrada.");

  const dbEntries = await prisma.entry.findMany({
    where: { workspaceId: params.workspaceId, walletId: params.walletId },
    select: {
      id: true,
      walletId: true,
      categoryId: true,
      nature: true,
      amount: true,
      transactionDate: true,
      dueDate: true,
      statusCode: true,
      recurrenceCode: true,
      isFixedOverride: true,
      groupId: true,
    },
  });

  const entries = dbEntries.map(toFinanceEntry);
  const systemBalance = walletBalance(entries, params.walletId, new Date());

  return prisma.balanceReconciliation.create({
    data: {
      workspaceId: params.workspaceId,
      walletId: params.walletId,
      declaredBalance: new Decimal(params.declaredBalance),
      systemBalance,
      checkedBy: params.checkedBy,
    },
  });
}

/** Última conciliação de cada carteira ativa do workspace — usado pela tela de conferência. */
export async function latestReconciliationByWallet(workspaceId: string) {
  const rows = await prisma.balanceReconciliation.findMany({
    where: { workspaceId },
    orderBy: { checkedAt: "desc" },
  });

  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.walletId)) latest.set(row.walletId, row);
  }
  return latest;
}
