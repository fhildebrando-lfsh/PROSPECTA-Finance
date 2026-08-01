"use client";

import { useState } from "react";
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";
import { updateNatureLabel } from "./actions";

export interface NatureLabelRow {
  code: string;
  labelPt: string;
}

export function NatureLabelsTable({ natureLabels, isAdmin }: { natureLabels: NatureLabelRow[]; isAdmin: boolean }) {
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast, notify } = useSavedToast();

  return (
    <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
      {toast}
      {error && <p className="px-3 pt-2 text-sm text-red-400">{error}</p>}
      <table className="w-full text-sm">
        <thead className="bg-black/20 text-left text-zinc-400">
          <tr>
            <th className="px-3 py-2 font-medium">Código</th>
            <th className="px-3 py-2 font-medium">Rótulo exibido</th>
            {isAdmin && <th className="px-3 py-2 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {natureLabels.map((n) =>
            editingCode === n.code ? (
              <NatureLabelEditRow
                key={n.code}
                natureLabel={n}
                onCancel={() => setEditingCode(null)}
                onSaved={() => {
                  setEditingCode(null);
                  notify();
                }}
                setError={setError}
              />
            ) : (
              <tr key={n.code} className="border-t border-indigo-900/50 text-zinc-200">
                <td className="px-3 py-2 font-mono text-xs text-zinc-500">{n.code}</td>
                <td className="px-3 py-2">{n.labelPt}</td>
                {isAdmin && (
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => setEditingCode(n.code)} className={BTN_SECONDARY}>
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

function NatureLabelEditRow({
  natureLabel,
  onCancel,
  onSaved,
  setError,
}: {
  natureLabel: NatureLabelRow;
  onCancel: () => void;
  onSaved: () => void;
  setError: (msg: string | null) => void;
}) {
  const [labelPt, setLabelPt] = useState(natureLabel.labelPt);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("code", natureLabel.code);
      fd.set("labelPt", labelPt);
      await updateNatureLabel(fd);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t border-indigo-900/50 bg-black/20 text-zinc-100">
      <td className="px-3 py-2 font-mono text-xs text-zinc-500">{natureLabel.code}</td>
      <td className="px-3 py-2">
        <input
          value={labelPt}
          onChange={(e) => setLabelPt(e.target.value)}
          className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
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
