import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createCategory, updateCategory } from "./actions";

const NATURES = ["RECEITA", "DESPESA", "INVESTIMENTO", "OUTRO"] as const;

export default async function CategoriasPage() {
  const profile = await requireProfile();
  const isAdmin = profile.isPlatformAdmin;

  const [categories, natureLabels] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ nature: "asc" }, { sortOrder: "asc" }] }),
    prisma.natureLabel.findMany(),
  ]);
  const labelByCode = new Map(natureLabels.map((n) => [n.code, n.labelPt]));

  return (
    <div className="flex flex-col gap-8">
      {/* §20 — campo travado fica visível e desabilitado, com o motivo ao lado, nunca escondido. */}
      {!isAdmin && (
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-500">
          Categoria é editada só pelo administrador — é o eixo de comparação entre períodos e (na consultoria) entre
          clientes.
        </p>
      )}

      {NATURES.map((nature) => (
        <div key={nature}>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">{labelByCode.get(nature) ?? nature}</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Ordem</th>
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {categories
                  .filter((c) => c.nature === nature)
                  .map((c) => (
                    <tr key={c.id} className="border-t border-zinc-800 text-zinc-200">
                      <td className="px-3 py-2" colSpan={3}>
                        <form action={updateCategory} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={c.id} />
                          <input
                            type="number"
                            name="sortOrder"
                            defaultValue={c.sortOrder}
                            disabled={!isAdmin}
                            className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 disabled:opacity-50"
                          />
                          <input
                            name="name"
                            defaultValue={c.name}
                            disabled={!isAdmin}
                            className="w-64 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 disabled:opacity-50"
                          />
                          {isAdmin && (
                            <button
                              type="submit"
                              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
                            >
                              Salvar
                            </button>
                          )}
                        </form>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Nova categoria</h2>
          <form action={createCategory} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Tipo
              <select name="nature" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
                {NATURES.map((n) => (
                  <option key={n} value={n}>
                    {labelByCode.get(n) ?? n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Nome
              <input
                name="name"
                required
                className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Ordem
              <input
                type="number"
                name="sortOrder"
                defaultValue={0}
                className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400"
            >
              Criar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
