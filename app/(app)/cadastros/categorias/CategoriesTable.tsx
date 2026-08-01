"use client";

import { useState } from "react";
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";
import { updateCategory } from "./actions";

export interface CategoryRow {
  id: string;
  name: string;
  sortOrder: number;
}

export function CategoriesTable({ categories, isAdmin }: { categories: CategoryRow[]; isAdmin: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast, notify } = useSavedToast();

  return (
    <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
      {toast}
      {error && <p className="px-3 pt-2 text-sm text-red-400">{error}</p>}
      <table className="w-full text-sm">
        <thead className="bg-black/20 text-left text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Ordem</th>
            <th className="px-3 py-2 font-medium">Nome</th>
            {isAdmin && <th className="px-3 py-2 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {categories.map((c) =>
            editingId === c.id ? (
              <CategoryEditRow
                key={c.id}
                category={c}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  notify();
                }}
                setError={setError}
              />
            ) : (
              <tr key={c.id} className="border-t border-indigo-900/50 text-zinc-200">
                <td className="px-3 py-2 text-xs text-zinc-400">{c.sortOrder}</td>
                <td className="px-3 py-2">{c.name}</td>
                {isAdmin && (
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setEditingId(c.id)} className={BTN_SECONDARY}>
                      Editar
                    </button>
                  </td>
                )}
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoryEditRow({
  category,
  onCancel,
  onSaved,
  setError,
}: {
  category: CategoryRow;
  onCancel: () => void;
  onSaved: () => void;
  setError: (msg: string | null) => void;
}) {
  const [name, setName] = useState(category.name);
  const [sortOrder, setSortOrder] = useState(String(category.sortOrder));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", category.id);
      fd.set("name", name);
      fd.set("sortOrder", sortOrder);
      await updateCategory(fd);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t border-indigo-900/50 bg-black/20 text-zinc-100">
      <td className="px-3 py-2">
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-64 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <div className="flex gap-1.5">
          <button type="button" disabled={saving} onClick={save} className={BTN_PRIMARY}>
            {saving ? "…" : "Salvar"}
          </button>
          <button type="button" onClick={onCancel} className={BTN_GHOST}>
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  );
}
