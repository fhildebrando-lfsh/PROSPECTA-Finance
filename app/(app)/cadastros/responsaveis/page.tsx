import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { createPerson } from "./actions";
import { PeopleTable } from "./PeopleTable";

export default async function ResponsaveisPage() {
  const workspaceId = await requireWorkspaceId();
  const people = await prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <PeopleTable people={people.map((p) => ({ id: p.id, name: p.name, isShared: p.isShared }))} />

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
          <button type="submit" className={BTN_PRIMARY}>
            Criar
          </button>
        </form>
      </div>
    </div>
  );
}
