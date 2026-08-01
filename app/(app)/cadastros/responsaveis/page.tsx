import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createPerson, updatePerson, deletePerson } from "./actions";

export default async function ResponsaveisPage() {
  const workspaceId = await requireWorkspaceId();
  const people = await prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Compartilhado</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-t border-indigo-900/50 text-zinc-200">
                <td className="px-3 py-2">
                  <form action={updatePerson} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="name"
                      defaultValue={p.name}
                      className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                    />
                    <label className="flex items-center gap-1 text-xs text-zinc-400">
                      <input type="checkbox" name="isShared" defaultChecked={p.isShared} />
                      compartilhado
                    </label>
                    <button type="submit" className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">
                      Salvar
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-500">{p.isShared ? "sim" : "não"}</td>
                <td className="px-3 py-2">
                  <form action={deletePerson}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="rounded-lg border border-red-900 px-2 py-1 text-xs text-red-400 hover:bg-red-950">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Novo responsável</h2>
        <form action={createPerson} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome
            <input
              name="name"
              required
              className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-zinc-400">
            <input type="checkbox" name="isShared" />
            compartilhado (ex.: &quot;Felipe &amp; Dani&quot;)
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
