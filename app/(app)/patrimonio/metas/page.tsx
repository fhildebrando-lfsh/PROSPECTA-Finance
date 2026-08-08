import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { walletBalance } from "@/lib/finance/balance";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { goalProgress } from "@/lib/finance/goal";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { createGoal } from "./actions";
import { GoalCard } from "./GoalCard";

export default async function MetasPage() {
  const workspaceId = await requireWorkspaceId();
  const today = new Date();

  const [goals, caixinhas, dbEntries] = await Promise.all([
    prisma.goal.findMany({ where: { workspaceId }, include: { wallet: true }, orderBy: { name: "asc" } }),
    prisma.wallet.findMany({ where: { workspaceId, kindCode: "CONTA_CAIXA", isActive: true }, orderBy: { name: "asc" } }),
    prisma.entry.findMany({ where: { workspaceId } }),
  ]);

  const entries = dbEntries.map(toFinanceEntry);
  const walletIdsWithActiveGoal = new Set(goals.filter((g) => g.isActive).map((g) => g.walletId));
  const availableCaixinhas = caixinhas.filter((w) => !walletIdsWithActiveGoal.has(w.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <a href="/api/patrimonio/metas/pdf" className={BTN_PRIMARY}>
          Baixar PDF
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => {
          const balance = walletBalance(entries, g.walletId, today);
          const progress = goalProgress(balance, g.targetAmount);
          return (
            <GoalCard
              key={g.id}
              goal={{
                id: g.id,
                name: g.name,
                walletName: g.wallet.name,
                balanceFormatted: formatCurrencyBRL(balance),
                targetAmountFormatted: formatCurrencyBRL(g.targetAmount),
                targetAmountRaw: g.targetAmount.toNumber(),
                targetDateIso: g.targetDate ? g.targetDate.toISOString().slice(0, 10) : "",
                targetDateFormatted: g.targetDate ? formatDateBR(g.targetDate) : null,
                progress: progress.toNumber(),
                isActive: g.isActive,
                pinnedToPainel: g.pinnedToPainel,
              }}
            />
          );
        })}
        {goals.length === 0 && <p className="text-sm text-indigo-300">Nenhuma meta cadastrada ainda.</p>}
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Nova meta</h2>
        {availableCaixinhas.length === 0 ? (
          <p className="text-xs text-indigo-300">
            Todas as caixinhas já têm uma meta ativa, ou não há nenhuma caixinha cadastrada em Cadastros → Carteiras.
          </p>
        ) : (
          <form action={createGoal} className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Nome
              <input name="name" required className="w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Caixinha vinculada
              <select name="walletId" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
                {availableCaixinhas.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Valor-alvo
              <input
                type="number"
                name="targetAmount"
                min="0"
                step="0.01"
                required
                className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Data-alvo (opcional)
              <input type="date" name="targetDate" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100" />
            </label>
            <button type="submit" className={BTN_PRIMARY}>
              Criar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
