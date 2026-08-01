import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createSubcategory, updateSubcategory, toggleSubcategoryActive } from "./actions";

export default async function SubcategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const profile = await requireProfile();
  const isAdmin = profile.isPlatformAdmin;
  const { categoryId } = await searchParams;

  const categories = await prisma.category.findMany({ orderBy: [{ nature: "asc" }, { sortOrder: "asc" }] });
  const selectedCategoryId = categoryId || categories[0]?.id;

  const subcategories = selectedCategoryId
    ? await prisma.subcategory.findMany({
        where: { categoryId: selectedCategoryId, workspaceId: null },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      {!isAdmin && (
        <p className="rounded-lg border border-indigo-900/50 bg-[#131A47] px-3 py-2 text-sm text-zinc-500">
          Subcategoria é editada só pelo administrador.
        </p>
      )}

      <form className="flex gap-3 text-sm">
        <select
          name="categoryId"
          defaultValue={selectedCategoryId}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nature} — {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800">
          Ver
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {subcategories.map((s) => (
              <tr key={s.id} className={`border-t border-indigo-900/50 ${s.isActive ? "text-zinc-200" : "text-zinc-600"}`}>
                <td className="px-3 py-2">
                  <form action={updateSubcategory} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      name="name"
                      defaultValue={s.name}
                      disabled={!isAdmin}
                      className="w-64 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 disabled:opacity-50"
                    />
                    {isAdmin && (
                      <button type="submit" className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">
                        Salvar
                      </button>
                    )}
                  </form>
                </td>
                <td className="px-3 py-2">
                  {isAdmin && (
                    <form action={toggleSubcategoryActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="isActive" value={String(s.isActive)} />
                      <button type="submit" className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">
                        {s.isActive ? "Arquivar" : "Reativar"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {subcategories.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhuma subcategoria.</p>}
      </div>

      {isAdmin && selectedCategoryId && (
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Nova subcategoria</h2>
          <form action={createSubcategory} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="categoryId" value={selectedCategoryId} />
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Nome
              <input
                name="name"
                required
                className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
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
