"use client";

import { useState } from "react";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";
import { setBudget } from "./actions";

/**
 * Formatação de moeda local, sem depender de `lib/format.ts::formatCurrencyBRL` —
 * aquela função aceita `Decimal`, o que arrasta o runtime do Prisma
 * (`node:crypto`/`node:fs`/...) para o bundle do client, e webpack não consegue
 * empacotar módulos Node para o navegador. Este componente só lida com `number`
 * puro (já convertido no server component da página), então um formatter
 * dedicado evita o import problemático.
 */
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function formatCurrencyBRL(amount: number): string {
  return currencyFormatter.format(amount);
}

export interface BudgetRow {
  categoryId: string;
  categoryName: string;
  planned: number;
  realized: number;
}

function usedTone(planned: number, realized: number): "emerald" | "amber" | "red" | "zinc" {
  if (planned <= 0) return realized > 0 ? "red" : "zinc";
  const pct = (realized / planned) * 100;
  if (pct > 100) return "red";
  if (pct >= 80) return "amber";
  return "emerald";
}

const TONE_CLASS: Record<string, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
  zinc: "text-zinc-500",
};

export function BudgetTable({ rows, year, month }: { rows: BudgetRow[]; year: number; month: number }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast, notify } = useSavedToast();

  return (
    <div className="flex flex-col gap-3">
      {toast}
      <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 text-right font-medium">Orçado</th>
              <th className="px-3 py-2 text-right font-medium">Realizado</th>
              <th className="px-3 py-2 text-right font-medium">Diferença</th>
              <th className="px-3 py-2 text-right font-medium">% usado</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const diff = row.planned - row.realized;
              const pct = row.planned > 0 ? (row.realized / row.planned) * 100 : null;
              const tone = usedTone(row.planned, row.realized);

              return editingId === row.categoryId ? (
                <BudgetEditRow
                  key={row.categoryId}
                  row={row}
                  year={year}
                  month={month}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    notify();
                  }}
                />
              ) : (
                <tr key={row.categoryId} className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
                  <td className="px-3 py-2">{row.categoryName}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {row.planned > 0 ? formatCurrencyBRL(row.planned) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {row.realized > 0 ? formatCurrencyBRL(row.realized) : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono tabular-nums ${diff < 0 ? "text-red-400" : "text-zinc-300"}`}>
                    {row.planned > 0 ? formatCurrencyBRL(diff) : "—"}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono tabular-nums ${TONE_CLASS[tone]}`}>
                    {pct !== null ? `${pct.toFixed(0)}%` : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button type="button" onClick={() => setEditingId(row.categoryId)} className={BTN_GHOST}>
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-indigo-300">
                  Nenhuma categoria de despesa cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BudgetEditRow({
  row,
  year,
  month,
  onCancel,
  onSaved,
}: {
  row: BudgetRow;
  year: number;
  month: number;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(row.planned > 0 ? String(row.planned) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("categoryId", row.categoryId);
      fd.set("year", String(year));
      fd.set("month", String(month));
      fd.set("plannedAmount", value || "0");
      await setBudget(fd);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-t border-indigo-900/50 bg-black/20 text-zinc-100">
      <td className="px-3 py-2">{row.categoryName}</td>
      <td className="px-3 py-2 text-right">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-right text-zinc-100"
          autoFocus
        />
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-400">
        {row.realized > 0 ? formatCurrencyBRL(row.realized) : "—"}
      </td>
      <td className="px-3 py-2 text-right text-zinc-500">—</td>
      <td className="px-3 py-2 text-right text-zinc-500">—</td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        <div className="flex justify-end gap-1.5">
          <button type="button" disabled={saving} onClick={save} className={BTN_PRIMARY}>
            {saving ? "…" : "Salvar"}
          </button>
          <button type="button" onClick={onCancel} className={BTN_GHOST}>
            Cancelar
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </td>
    </tr>
  );
}
