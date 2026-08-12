"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkMarkSettled } from "./actions";

export interface CompromissoEntryRow {
  id: string;
  description: string;
  walletName: string;
  categoryName: string;
  responsibleName: string;
  dueDateFormatted: string;
  amountFormatted: string;
  isNegative: boolean;
  statusCode: string;
}

export interface CompromissoGroup {
  bucket: string;
  label: string;
  highlight: boolean;
  entries: CompromissoEntryRow[];
}

export function CompromissosList({ groups }: { groups: CompromissoGroup[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allEntries = groups.flatMap((g) => g.entries);
  const allSelected = allEntries.length > 0 && selected.size === allEntries.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allEntries.map((e) => e.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function settle(ids: string[]) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await bulkMarkSettled(ids);
      if (ids.length > 1) {
        setMessage(
          result.settled === result.total
            ? `${result.settled} lançamento(s) marcados.`
            : `${result.settled} de ${result.total} marcados — o resto já não estava mais "a pagar"/"a receber".`,
        );
      }
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {allEntries.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          Selecionar todos ({allEntries.length})
        </label>
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          <span>{selected.size} selecionado(s)</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => settle([...selected])}
            className="rounded-lg border border-amber-700 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-900 disabled:opacity-50"
          >
            {busy ? "Marcando…" : "Marcar como pago/recebido"}
          </button>
        </div>
      )}
      {message && <p className="text-sm text-zinc-400">{message}</p>}

      {groups.map((group) => (
        <div key={group.bucket}>
          <h2 className={`mb-2 text-sm font-medium ${group.highlight ? "text-rose-400" : "text-zinc-300"}`}>
            {group.label} ({group.entries.length})
          </h2>
          {group.entries.length === 0 ? (
            <p className="text-sm text-zinc-600">Nada aqui.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {group.entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
                    group.highlight ? "border-rose-900 bg-rose-950/30" : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <input type="checkbox" checked={selected.has(entry.id)} onChange={() => toggleOne(entry.id)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-100">{entry.description}</p>
                    <p className="text-xs text-zinc-500">
                      {entry.walletName} · {entry.categoryName} · {entry.responsibleName} · vence{" "}
                      {entry.dueDateFormatted}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono text-sm tabular-nums ${entry.isNegative ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {entry.amountFormatted}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => settle([entry.id])}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      {entry.statusCode === "A_RECEBER" ? "Marcar como recebido" : "Marcar como pago"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
