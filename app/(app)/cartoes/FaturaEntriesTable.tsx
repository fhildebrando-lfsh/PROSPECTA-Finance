"use client";

import { useMemo, useState } from "react";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { updateFaturaEntry } from "./actions";

export interface FaturaEntryRow {
  id: string;
  transactionDateFormatted: string;
  /** Descrição original da fatura, como o banco imprimiu — null quando o lançamento não
   * veio de importação de PDF (ex.: lançado manualmente nesta carteira). Nunca editável. */
  importedDescription: string | null;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string | null;
  nature: string;
  amountFormatted: string;
  isNegative: boolean;
  installmentNumber: number | null;
  installmentTotal: number | null;
}

interface CategoryOption {
  id: string;
  nature: string;
  name: string;
}
interface SubcategoryOption {
  id: string;
  categoryId: string;
  name: string;
}

export function FaturaEntriesTable({
  entries,
  categories,
  subcategories,
}: {
  entries: FaturaEntryRow[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
            <th className="px-3 py-2 font-medium">Compra</th>
            <th className="px-3 py-2 font-medium">Descrição da fatura</th>
            <th className="px-3 py-2 font-medium">Descrição personalizada</th>
            <th className="px-3 py-2 font-medium">Categoria</th>
            <th className="px-3 py-2 font-medium">Subcategoria</th>
            <th className="px-3 py-2 text-right font-medium">Valor</th>
            <th className="px-3 py-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <FaturaEntryRowView key={entry.id} entry={entry} categories={categories} subcategories={subcategories} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FaturaEntryRowView({
  entry,
  categories,
  subcategories,
}: {
  entry: FaturaEntryRow;
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState(entry.description);
  const [categoryId, setCategoryId] = useState(entry.categoryId);
  const [subcategoryId, setSubcategoryId] = useState(entry.subcategoryId ?? "");

  const availableCategories = useMemo(() => categories.filter((c) => c.nature === entry.nature), [categories, entry.nature]);
  const availableSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryId === categoryId),
    [subcategories, categoryId],
  );

  function resetToView() {
    setDescription(entry.description);
    setCategoryId(entry.categoryId);
    setSubcategoryId(entry.subcategoryId ?? "");
    setEditing(false);
    setError(null);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("entryId", entry.id);
      fd.set("description", description.trim() || entry.description);
      fd.set("categoryId", categoryId);
      fd.set("subcategoryId", subcategoryId);
      await updateFaturaEntry(fd);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-b border-indigo-900/30 align-top text-indigo-100 last:border-0">
      <td className="px-3 py-2 whitespace-nowrap">{entry.transactionDateFormatted}</td>
      <td className="px-3 py-2 text-zinc-400">{entry.importedDescription ?? "—"}</td>
      <td className="px-3 py-2">
        {editing ? (
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-w-[160px] rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
          />
        ) : (
          <>
            {entry.description}
            {entry.installmentTotal && (
              <span className="ml-1 text-xs text-zinc-500">
                ({entry.installmentNumber}/{entry.installmentTotal})
              </span>
            )}
          </>
        )}
      </td>
      <td className="px-3 py-2">
        {editing ? (
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
            className="w-full min-w-[140px] rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
          >
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-zinc-400">{entry.categoryName}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {editing ? (
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="w-full min-w-[140px] rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
          >
            <option value="">—</option>
            {availableSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-zinc-400">{entry.subcategoryName ?? "—"}</span>
        )}
      </td>
      <td className={`px-3 py-2 text-right font-mono tabular-nums ${entry.isNegative ? "text-red-400" : "text-emerald-400"}`}>
        {entry.amountFormatted}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {editing ? (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1.5">
              <button type="button" onClick={handleSave} disabled={busy} className={BTN_PRIMARY}>
                {busy ? "…" : "Salvar"}
              </button>
              <button type="button" onClick={resetToView} disabled={busy} className={BTN_GHOST}>
                Cancelar
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className={BTN_GHOST}>
            Editar
          </button>
        )}
      </td>
    </tr>
  );
}
