import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createWallet, updateWallet, toggleWalletActive } from "./actions";

export default async function CarteirasPage() {
  const workspaceId = await requireWorkspaceId();

  const [wallets, kinds, institutions] = await Promise.all([
    prisma.wallet.findMany({ where: { workspaceId }, include: { kind: true }, orderBy: { name: "asc" } }),
    prisma.walletKind.findMany({ orderBy: { labelPt: "asc" } }),
    prisma.institution.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Instituição</th>
              <th className="px-3 py-2 font-medium">Fecha dia</th>
              <th className="px-3 py-2 font-medium">Vence dia</th>
              <th className="px-3 py-2 font-medium">Limite</th>
              <th className="px-3 py-2 font-medium"></th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) => (
              <tr key={w.id} className={`border-t border-zinc-800 ${w.isActive ? "text-zinc-200" : "text-zinc-600"}`}>
                <td className="px-3 py-2" colSpan={6}>
                  <form action={updateWallet} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={w.id} />
                    <input
                      name="name"
                      defaultValue={w.name}
                      className="w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                    />
                    <span className="text-xs text-zinc-500">{w.kind?.labelPt ?? w.kindCode}</span>
                    <select
                      name="institutionId"
                      defaultValue={w.institutionId ?? ""}
                      className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                    >
                      <option value="">— sem instituição —</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="closingDay"
                      placeholder="fecha"
                      defaultValue={w.closingDay ?? ""}
                      className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                    />
                    <input
                      type="number"
                      name="dueDay"
                      placeholder="vence"
                      defaultValue={w.dueDay ?? ""}
                      className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                    />
                    <input
                      name="creditLimit"
                      placeholder="limite"
                      defaultValue={w.creditLimit?.toString() ?? ""}
                      className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                    />
                    <button type="submit" className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">
                      Salvar
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2">
                  <form action={toggleWalletActive}>
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="isActive" value={String(w.isActive)} />
                    <button type="submit" className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">
                      {w.isActive ? "Arquivar" : "Reativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
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
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400"
          >
            Criar
          </button>
        </form>
      </div>
    </div>
  );
}
