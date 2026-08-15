import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { createWallet } from "./actions";
import { WalletsTable } from "./WalletsTable";
import { latestReconciliationByWallet } from "@/lib/method/reconciliation";

export default async function CarteirasPage() {
  const workspaceId = await requireWorkspaceId();

  const [wallets, kinds, institutions, reconciliationByWallet] = await Promise.all([
    prisma.wallet.findMany({ where: { workspaceId }, include: { kind: true }, orderBy: { name: "asc" } }),
    prisma.walletKind.findMany({ orderBy: { labelPt: "asc" } }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
    latestReconciliationByWallet(workspaceId),
  ]);

  const walletRows = wallets.map((w) => {
    const reconciliation = reconciliationByWallet.get(w.id);
    return {
      id: w.id,
      name: w.name,
      kindLabel: w.kind?.labelPt ?? w.kindCode,
      institutionId: w.institutionId ?? "",
      closingDay: w.closingDay?.toString() ?? "",
      dueDay: w.dueDay?.toString() ?? "",
      creditLimit: w.creditLimit?.toString() ?? "",
      isActive: w.isActive,
      reconciliation: reconciliation
        ? {
            declaredBalance: reconciliation.declaredBalance.toString(),
            systemBalance: reconciliation.systemBalance.toString(),
            checkedAt: reconciliation.checkedAt.toISOString(),
          }
        : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <WalletsTable
        wallets={walletRows}
        institutions={institutions.map((i) => ({ id: i.id, name: i.name }))}
      />

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Nova carteira</h2>
        <form action={createWallet} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome
            <input
              name="name"
              required
              className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Tipo
            <select
              name="kindCode"
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            >
              {kinds.map((k) => (
                <option key={k.code} value={k.code}>
                  {k.labelPt}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Instituição
            <select
              name="institutionId"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            >
              <option value="">— sem instituição —</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Criar
          </button>
        </form>
      </div>
    </div>
  );
}
