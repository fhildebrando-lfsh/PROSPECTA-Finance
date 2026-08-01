"use client";

import { useState } from "react";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";
import { updatePerson, deletePerson } from "./actions";

export interface PersonRow {
  id: string;
  name: string;
  isShared: boolean;
}

export function PeopleTable({ people }: { people: PersonRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, notify } = useSavedToast();

  const allSelected = people.length > 0 && selected.size === people.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(people.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Excluir ${selected.size} responsável(is)? Isso não pode ser desfeito.`)) return;
    setBusy(true);
    setError(null);
    try {
      const ids = [...selected];
      const results = await Promise.allSettled(
        ids.map((id) => {
          const fd = new FormData();
          fd.set("id", id);
          return deletePerson(fd);
        }),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        setError(`${failed} responsável(is) não puderam ser excluídos — já têm lançamentos.`);
      }
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {toast}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-indigo-400/60 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-100">
          <span>{selected.size} selecionado(s)</span>
          <button type="button" disabled={busy} onClick={bulkDelete} className={BTN_DANGER}>
            Excluir
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-3 py-2 font-medium">Nome</th>
              <th className="px-3 py-2 font-medium">Compartilhado</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) =>
              editingId === p.id ? (
                <PersonEditRow
                  key={p.id}
                  person={p}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    notify();
                  }}
                  setError={setError}
                />
              ) : (
                <tr key={p.id} className="border-t border-indigo-900/50 text-zinc-200">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                  </td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{p.isShared ? "sim" : "não"}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setEditingId(p.id)} className={BTN_SECONDARY}>
                      Editar
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {people.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhum responsável cadastrado.</p>}
      </div>
    </div>
  );
}

function PersonEditRow({
  person,
  onCancel,
  onSaved,
  setError,
}: {
  person: PersonRow;
  onCancel: () => void;
  onSaved: () => void;
  setError: (msg: string | null) => void;
}) {
  const [name, setName] = useState(person.name);
  const [isShared, setIsShared] = useState(person.isShared);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", person.id);
      fd.set("name", name);
      if (isShared) fd.set("isShared", "on");
      await updatePerson(fd);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t border-indigo-900/50 bg-black/20 text-zinc-100">
      <td className="px-3 py-2"></td>
      <td className="px-3 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        />
      </td>
      <td className="px-3 py-2">
        <label className="flex items-center gap-1 text-xs text-zinc-400">
          <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} />
          compartilhado
        </label>
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
