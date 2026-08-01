"use client";

import { useMemo, useState } from "react";
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

interface CreatedItem {
  id: string;
  name: string;
  categoryName: string;
}

/**
 * Independente do seletor "Ver" acima — cria direto por Tipo → Categoria
 * (filtrada) → Nome, em vez de obrigar escolher antes numa lista achatada
 * de ~200 categorias. Não navega pra lugar nenhum ao salvar (isso mudava o
 * que o "Ver" estava mostrando, o usuário achou ruim) — em vez disso, cada
 * subcategoria criada nesta sessão aparece no card "Subcategoria
 * cadastrada" abaixo, pra manter o controle do que foi criado sem perder
 * o que estava sendo visualizado.
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
  const [nature, setNature] = useState<Nature>(defaultNature);
  const [categoryId, setCategoryId] = useState(
    () => categories.find((c) => c.nature === defaultNature)?.id ?? "",
  );
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedItem[]>([]);
  const { toast, notify } = useSavedToast();

  const availableCategories = useMemo(() => categories.filter((c) => c.nature === nature), [categories, nature]);

  function handleNatureChange(next: Nature) {
    setNature(next);
    setCategoryId(categories.find((c) => c.nature === next)?.id ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!categoryId || !trimmedName) return;
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("categoryId", categoryId);
      fd.set("name", trimmedName);
      await createSubcategory(fd);
      const categoryName = categories.find((c) => c.id === categoryId)?.name ?? "";
      setCreated((prev) => [{ id: `${categoryId}-${trimmedName}-${prev.length}`, name: trimmedName, categoryName }, ...prev]);
      setName("");
      notify();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
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

      {created.length > 0 && (
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="mb-3 text-sm font-medium text-zinc-300">Subcategoria cadastrada</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {created.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
                <span className="text-zinc-100">{item.name}</span>
                <span className="text-xs text-zinc-400">{item.categoryName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
