import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import {
  debtDeclineTimeline,
  monthlyDebtCommitment,
  openInstallmentGroups,
  totalRemainingDebt,
  type InstallmentEntry,
} from "@/lib/finance/open-installments";
import { averageMonthlyExpense } from "@/lib/finance/reserve";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { MonthlyChart, type MonthlyChartPoint } from "@/components/charts/MonthlyChart";

export default async function DividasPage() {
  const workspaceId = await requireWorkspaceId();
  const today = new Date();

  const [installmentEntries, allEntries] = await Promise.all([
    prisma.entry.findMany({
      where: { workspaceId, nature: "DESPESA", installmentTotal: { not: null } },
      include: { category: true, wallet: true },
    }),
    prisma.entry.findMany({ where: { workspaceId } }),
  ]);

  const entries: InstallmentEntry[] = installmentEntries.map((e) => ({
    id: e.id,
    groupId: e.groupId,
    walletId: e.walletId,
    categoryId: e.categoryId,
    description: e.description,
    amount: e.amount,
    dueDate: e.dueDate,
    status: e.statusCode as InstallmentEntry["status"],
    installmentNumber: e.installmentNumber,
    installmentTotal: e.installmentTotal,
  }));

  const walletNameById = new Map(installmentEntries.map((e) => [e.walletId, e.wallet.name]));
  const categoryNameById = new Map(installmentEntries.map((e) => [e.categoryId, e.category.name]));

  const groups = openInstallmentGroups(entries).sort((a, b) => a.remainingAmount.comparedTo(b.remainingAmount));

  const totalDebt = totalRemainingDebt(groups);
  const monthlyCommitment = monthlyDebtCommitment(groups);
  const avgExpense = averageMonthlyExpense(allEntries.map(toFinanceEntry), today, 6);
  const commitmentPct = avgExpense.isZero() ? null : monthlyCommitment.abs().div(avgExpense.abs()).times(100);

  const openGroupIds = new Set(groups.map((g) => g.groupId));
  const declineTimeline = debtDeclineTimeline(entries, openGroupIds);
  const declineChartData: MonthlyChartPoint[] = declineTimeline.map((p) => ({
    label: formatDateBR(p.date),
    receita: 0,
    despesa: 0,
    saldo: p.remaining.toNumber(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Financiamentos e compras parceladas ainda em aberto — o que já foi quitado não aparece aqui. Pensado para
          mostrar a magnitude das suas dívidas, até quando elas vão e quanto pesam no orçamento mensal.
        </p>
        <a href="/api/patrimonio/dividas/pdf" className={BTN_PRIMARY}>
          Baixar PDF
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Dívida total em aberto</p>
          <p className="font-mono text-xl tabular-nums text-red-400">{formatCurrencyBRL(totalDebt.abs())}</p>
        </div>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Compromisso mensal</p>
          <p className="font-mono text-xl tabular-nums text-red-400">{formatCurrencyBRL(monthlyCommitment.abs())}</p>
        </div>
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">% da despesa mensal média</p>
          <p className="font-mono text-xl tabular-nums text-amber-400">
            {commitmentPct !== null ? `${commitmentPct.toFixed(0)}%` : "—"}
          </p>
        </div>
      </div>

      {declineChartData.length >= 2 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Diminuição das dívidas</h2>
          <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <MonthlyChart data={declineChartData} />
          </div>
        </div>
      )}

      <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2 font-medium">Carteira</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 text-right font-medium">Total contratado</th>
              <th className="px-3 py-2 text-right font-medium">Parcelas</th>
              <th className="px-3 py-2 text-right font-medium">Restam</th>
              <th className="px-3 py-2 text-right font-medium">Valor restante</th>
              <th className="px-3 py-2 font-medium">Próxima</th>
              <th className="px-3 py-2 font-medium">Prazo (até quando)</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.groupId} className="border-b border-indigo-900/30 last:border-0">
                <td className="px-3 py-2 text-indigo-100">{g.description}</td>
                <td className="px-3 py-2 text-indigo-200">{walletNameById.get(g.walletId) ?? "—"}</td>
                <td className="px-3 py-2 text-indigo-200">{categoryNameById.get(g.categoryId) ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-300">
                  {formatCurrencyBRL(g.totalAmount.abs())}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-indigo-200">
                  {g.paidCount}/{g.installmentTotal}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-indigo-200">{g.remainingCount}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-red-400">
                  {formatCurrencyBRL(g.remainingAmount.abs())}
                </td>
                <td className="px-3 py-2 text-indigo-200">{g.nextDueDate ? formatDateBR(g.nextDueDate) : "—"}</td>
                <td className="px-3 py-2 text-indigo-200">{formatDateBR(g.lastDueDate)}</td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-indigo-300">
                  Nenhuma dívida em aberto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
