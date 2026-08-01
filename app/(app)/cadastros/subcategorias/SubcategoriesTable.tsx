"use client";

import { useState } from "react";
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";
import { updateSubcategory, toggleSubcategoryActive } from "./actions";

export interface SubcategoryRow {
  id: string;
  name: string;
  isActive: boolean;
}

export function SubcategoriesTable({ subcategories, isAdmin }: { subcategories: SubcategoryRow[]; isAdmin: boolean }) {
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
            <th className="px-3 py-2 font-medium">Nome</th>
            {isAdmin && <th className="px-3 py-2 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {subcategories.map((s) =>
            editingId === s.id ? (
              <SubcategoryEditRow
                key={s.id}
                subcategory={s}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  notify();
                }}
                setError={setError}
              />
            ) : (
              <tr key={s.id} className={`border-t border-indigo-900/50 ${s.isActive ? "text-zinc-200" : "text-zinc-500"}`}>
                <td className="px-3 py-2">{s.name}</td>
                {isAdmin && (
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setEditingId(s.id)} className={BTN_SECONDARY}>
                        Editar
                      </button>
                      <form
                        action={async (fd) => {
                          await toggleSubcategoryActive(fd);
                          notify();
                        }}
                      >
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="isActive" value={String(s.isActive)} />
                        <button type="submit" className={BTN_GHOST}>
                          {s.isActive ? "Arquivar" : "Reativar"}
                        </button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            ),
          )}
        </tbody>
      </table>
      {subcategories.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhuma subcategoria.</p>}
    </div>
  );
}

function SubcategoryEditRow({
  subcategory,
  onCancel,
  onSaved,
  setError,
}: {
  subcategory: SubcategoryRow;
  onCancel: () => void;
  onSaved: () => void;
  setError: (msg: string | null) => void;
}) {
  const [name, setName] = useState(subcategory.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", subcategory.id);
      fd.set("name", name);
      await updateSubcategory(fd);
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
