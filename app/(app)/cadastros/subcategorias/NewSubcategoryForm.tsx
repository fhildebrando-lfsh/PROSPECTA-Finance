"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";
import { createSubcategory } from "./actions";

const NATURES = ["RECEITA", "DESPESA", "INVESTIMENTO", "OUTRO"] as const;
type Nature = (typeof NATURES)[number];

export interface CategoryOption {
  id: string;
  name: string;
  nature: Nature;
}

/**
 * Independente do seletor "Ver" acima — cria direto por Tipo → Categoria
 * (filtrada) → Nome, em vez de obrigar escolher antes numa lista achatada
 * de ~200 categorias. Ao salvar, navega pra `?categoryId=...` da categoria
 * escolhida, então a lista de subcategorias acima já mostra o que acabou
 * de ser criado (pedido do usuário: "manter o controle do que foi criado").
 */
export function NewSubcategoryForm({
  categories,
  natureLabelByCode,
  defaultNature,
}: {
  categories: CategoryOption[];
  natureLabelByCode: Map<string, string>;
  defaultNature: Nature;
}) {
  const router = useRouter();
  const [nature, setNature] = useState<Nature>(defaultNature);
  const [categoryId, setCategoryId] = useState(
    () => categories.find((c) => c.nature === defaultNature)?.id ?? "",
  );
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, notify } = useSavedToast();

  const availableCategories = useMemo(() => categories.filter((c) => c.nature === nature), [categories, nature]);

  function handleNatureChange(next: Nature) {
    setNature(next);
    setCategoryId(categories.find((c) => c.nature === next)?.id ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("categoryId", categoryId);
      fd.set("name", name.trim());
      await createSubcategory(fd);
      setName("");
      notify();
      router.push(`/cadastros/subcategorias?categoryId=${categoryId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      {toast}
      <h2 className="mb-3 text-sm font-medium text-zinc-300">Nova subcategoria</h2>
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Tipo
          <select
            value={nature}
            onChange={(e) => handleNatureChange(e.target.value as Nature)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
          >
            {NATURES.map((n) => (
              <option key={n} value={n}>
                {natureLabelByCode.get(n) ?? n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Categoria
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
          >
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
          />
        </label>
        <button type="submit" disabled={saving} className={BTN_PRIMARY}>
          {saving ? "…" : "Criar"}
        </button>
      </form>
    </div>
  );
}
