import { requireWorkspaceId } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { openInstallmentGroups, type InstallmentEntry } from "@/lib/finance/open-installments";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";

export default async function ParceladasPage() {
  const workspaceId = await requireWorkspaceId();
  // Registro Nº 108 — a feature existia no catálogo e nenhuma tela a
  // consultava: desmarcá-la em /admin/planos não tinha efeito nenhum.
  if (!(await hasFeature(workspaceId, "relatorio_parceladas"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O relatório de Despesas parceladas está disponível a partir do plano Pro.</p>
        <p className="mt-2">Ele reúne todo parcelamento em aberto e mostra quanto de cada mês futuro já está comprometido.</p>
      </div>
    );
  }

  const dbEntries = await prisma.entry.findMany({
    where: { workspaceId, installmentTotal: { not: null } },
    include: { category: true, wallet: true },
  });

  const entries: InstallmentEntry[] = dbEntries.map((e) => ({
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

  const walletNameById = new Map(dbEntries.map((e) => [e.walletId, e.wallet.name]));
  const categoryNameById = new Map(dbEntries.map((e) => [e.categoryId, e.category.name]));

  const groups = openInstallmentGroups(entries);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Parcelamentos em aberto — quanto já foi pago, quanto falta e o prazo final de cada compromisso. Grupos já
          quitados não aparecem aqui.
        </p>
        <a href="/api/relatorios/parceladas/pdf" className={BTN_PRIMARY}>
          Baixar PDF
        </a>
      </div>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2 font-medium">Carteira</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 text-right font-medium">Parcelas</th>
              <th className="px-3 py-2 text-right font-medium">Restam</th>
              <th className="px-3 py-2 text-right font-medium">Valor restante</th>
              <th className="px-3 py-2 font-medium">Próxima</th>
              <th className="px-3 py-2 font-medium">Prazo</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.groupId} className="border-b border-indigo-900/30 last:border-0">
                <td className="px-3 py-2 text-indigo-100">{g.description}</td>
                <td className="px-3 py-2 text-indigo-200">{walletNameById.get(g.walletId) ?? "—"}</td>
                <td className="px-3 py-2 text-indigo-200">{categoryNameById.get(g.categoryId) ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-indigo-200">
                  {g.paidCount}/{g.installmentTotal}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-indigo-200">{g.remainingCount}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-red-400">
                  {formatCurrencyBRL(g.remainingAmount)}
                </td>
                <td className="px-3 py-2 text-indigo-200">{g.nextDueDate ? formatDateBR(g.nextDueDate) : "—"}</td>
                <td className="px-3 py-2 text-indigo-200">{formatDateBR(g.lastDueDate)}</td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-indigo-300">
                  Nenhum parcelamento em aberto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
