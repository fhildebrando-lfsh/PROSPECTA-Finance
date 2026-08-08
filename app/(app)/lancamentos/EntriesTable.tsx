"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface EntryRow {
  id: string;
  transactionDateFormatted: string;
  dueDateIso: string;
  dueDateFormatted: string;
  walletName: string;
  nature: string;
  natureLabel: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  description: string;
  responsibleId: string;
  responsibleName: string;
  amountAbs: string;
  isNegative: boolean;
  amountFormatted: string;
  amountClass: string;
  recurrenceLabel: string;
  statusCode: string;
  situacaoLabel: string;
  situacaoClass: string;
  rowClass: string;
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
interface PersonOption {
  id: string;
  name: string;
}
interface StatusOption {
  code: string;
  label: string;
}

export interface EntriesTableProps {
  entries: EntryRow[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  people: PersonOption[];
  statuses: StatusOption[];
}

const FREE_SIGN_NATURES = new Set(["INVESTIMENTO", "OUTRO"]);

export function EntriesTable({ entries, categories, subcategories, people, statuses }: EntriesTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = entries.length > 0 && selected.size === entries.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.id)));
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
    if (!confirm(`Excluir ${selected.size} lançamento(s)? Isso não pode ser desfeito.`)) return;
    setBusy(true);
    setError(null);
    try {
      const ids = [...selected];
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/entries/${id}`, { method: "DELETE" })),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) setError(`${failed} lançamento(s) não puderam ser excluídos.`);
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function bulkSettle() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const ids = [...selected];
      const results = await Promise.all(
        ids.map((id) => fetch(`/api/entries/${id}/settle`, { method: "PATCH" })),
      );
      const failed = results.filter((r) => !r.ok).length;
      const settled = results.length - failed;
      if (failed > 0) {
        setError(
          `${settled} marcado(s) como pago/recebido; ${failed} não se aplicavam (só funciona para "a pagar"/"a receber").`,
        );
      }
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          <span>{selected.size} selecionado(s)</span>
          <button
            type="button"
            disabled={busy}
            onClick={bulkSettle}
            className="rounded-lg border border-amber-700 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-900 disabled:opacity-50"
          >
            Marcar como pago/recebido
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={bulkDelete}
            className="rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950 disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="hidden overflow-x-auto rounded-xl border border-zinc-300 bg-zinc-50 md:block">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left text-zinc-600">
            <tr>
              <th className="px-3 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="px-3 py-2 font-medium">Compra</th>
              <th className="px-3 py-2 font-medium">Vence</th>
              <th className="px-3 py-2 font-medium">Carteira</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Subcategoria</th>
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2 font-medium">Responsável</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
              <th className="px-3 py-2 font-medium">Recorrência</th>
              <th className="px-3 py-2 font-medium">Situação</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) =>
              editingId === entry.id ? (
                <EditRow
                  key={entry.id}
                  entry={entry}
                  categories={categories}
                  subcategories={subcategories}
                  people={people}
                  statuses={statuses}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                  setError={setError}
                />
              ) : (
                <tr key={entry.id} className={`border-t border-zinc-200 ${entry.rowClass}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(entry.id)}
                      onChange={() => toggleOne(entry.id)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums">{entry.transactionDateFormatted}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums">{entry.dueDateFormatted}</td>
                  <td className="px-3 py-2">{entry.walletName}</td>
                  <td className="px-3 py-2">{entry.natureLabel}</td>
                  <td className="px-3 py-2">{entry.categoryName}</td>
                  <td className="px-3 py-2">{entry.subcategoryName || "—"}</td>
                  <td className="px-3 py-2">{entry.description}</td>
                  <td className="px-3 py-2">{entry.responsibleName}</td>
                  <td className={`whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums ${entry.amountClass}`}>
                    {entry.amountFormatted}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{entry.recurrenceLabel}</td>
                  <td className={`whitespace-nowrap px-3 py-2 ${entry.situacaoClass}`}>{entry.situacaoLabel}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(entry.id)}
                      className="rounded-lg border border-zinc-400 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {entries.length === 0 && <p className="p-4 text-sm text-zinc-500">Nenhum lançamento encontrado.</p>}
      </div>
    </div>
  );
}

function EditRow({
  entry,
  categories,
  subcategories,
  people,
  statuses,
  onCancel,
  onSaved,
  setError,
}: {
  entry: EntryRow;
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  people: PersonOption[];
  statuses: StatusOption[];
  onCancel: () => void;
  onSaved: () => void;
  setError: (msg: string | null) => void;
}) {
  const [description, setDescription] = useState(entry.description);
  const [categoryId, setCategoryId] = useState(entry.categoryId);
  const [subcategoryId, setSubcategoryId] = useState(entry.subcategoryId);
  const [responsibleId, setResponsibleId] = useState(entry.responsibleId);
  const [statusCode, setStatusCode] = useState(entry.statusCode);
  const [dueDate, setDueDate] = useState(entry.dueDateIso);
  const [absAmount, setAbsAmount] = useState(entry.amountAbs);
  const [negative, setNegative] = useState(entry.isNegative);
  const [saving, setSaving] = useState(false);

  const availableCategories = categories.filter((c) => c.nature === entry.nature);
  const availableSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryId === categoryId),
    [subcategories, categoryId],
  );
  const freeSign = FREE_SIGN_NATURES.has(entry.nature);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const abs = Math.abs(Number(absAmount) || 0);
      const signed = entry.nature === "DESPESA" ? -abs : entry.nature === "RECEITA" ? abs : negative ? -abs : abs;

      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || "(sem descrição)",
          categoryId,
          subcategoryId: subcategoryId || null,
          responsibleId,
          statusCode,
          dueDate,
          amount: signed.toFixed(2),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Falha ao salvar.");
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t border-zinc-200 bg-zinc-100">
      <td className="px-3 py-2"></td>
      <td className="px-3 py-2 font-mono text-xs tabular-nums text-zinc-500">{entry.transactionDateFormatted}</td>
      <td className="px-3 py-2">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-36 rounded-lg border border-zinc-400 bg-white px-2 py-1 text-xs text-zinc-900"
        />
      </td>
      <td className="px-3 py-2 text-xs text-zinc-500">{entry.walletName}</td>
      <td className="px-3 py-2 text-xs text-zinc-500">{entry.natureLabel}</td>
      <td className="px-3 py-2" colSpan={2}>
        <div className="flex gap-1">
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
            className="rounded-lg border border-zinc-400 bg-white px-2 py-1 text-xs text-zinc-900"
          >
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="rounded-lg border border-zinc-400 bg-white px-2 py-1 text-xs text-zinc-900"
          >
            <option value="">—</option>
            {availableSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-40 rounded-lg border border-zinc-400 bg-white px-2 py-1 text-xs text-zinc-900"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={responsibleId}
          onChange={(e) => setResponsibleId(e.target.value)}
          className="rounded-lg border border-zinc-400 bg-white px-2 py-1 text-xs text-zinc-900"
        >
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {freeSign && (
            <button
              type="button"
              onClick={() => setNegative((v) => !v)}
              className="rounded border border-zinc-400 px-1.5 py-1 text-xs text-zinc-700"
              title="Inverter sinal"
            >
              {negative ? "−" : "+"}
            </button>
          )}
          <input
            type="number"
            step="0.01"
            min="0"
            value={absAmount}
            onChange={(e) => setAbsAmount(e.target.value)}
            className="w-24 rounded-lg border border-zinc-400 bg-white px-2 py-1 text-right text-xs text-zinc-900"
          />
        </div>
      </td>
      <td className="px-3 py-2 text-xs text-zinc-500">{entry.recurrenceLabel}</td>
      <td className="px-3 py-2">
        <select
          value={statusCode}
          onChange={(e) => setStatusCode(e.target.value)}
          className="rounded-lg border border-zinc-400 bg-white px-2 py-1 text-xs text-zinc-900"
        >
          {statuses.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-lg bg-amber-500 px-2 py-1 text-xs font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {saving ? "…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-400 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200"
          >
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  );
}
