import { requireProfile, requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { createSubcategory } from "./actions";
import { SubcategoriesTable } from "./SubcategoriesTable";

/** Mesmas cores de `NATURE_STYLE` do lançamento rápido — ajuda a escanear a
 * lista longa de categorias por Tipo em vez de ler texto linha a linha. */
const NATURE_OPTION_STYLE: Record<string, { backgroundColor: string; color: string }> = {
  RECEITA: { backgroundColor: "#10b981", color: "#09090b" },
  DESPESA: { backgroundColor: "#ef4444", color: "#09090b" },
  INVESTIMENTO: { backgroundColor: "#3b82f6", color: "#09090b" },
  OUTRO: { backgroundColor: "#a1a1aa", color: "#09090b" },
};

export default async function SubcategoriasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string }>;
}) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const isAdmin = profile.isPlatformAdmin;
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  // §20 — editar/arquivar continua admin-only; criar é liberado pra quem tem escrita.
  const canCreate = isAdmin || membership?.role !== "LEITURA";
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
          Editar ou arquivar uma subcategoria existente é só do administrador — mas você pode criar novas abaixo.
        </p>
      )}

      <form className="flex gap-3 text-sm">
        <select
          name="categoryId"
          defaultValue={selectedCategoryId}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id} style={NATURE_OPTION_STYLE[c.nature]}>
              {c.nature} — {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className={BTN_SECONDARY}>
          Ver
        </button>
      </form>

      <SubcategoriesTable
        subcategories={subcategories.map((s) => ({ id: s.id, name: s.name, isActive: s.isActive }))}
        isAdmin={isAdmin}
      />

      {canCreate && selectedCategoryId && (
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
            <button type="submit" className={BTN_PRIMARY}>
              Criar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
