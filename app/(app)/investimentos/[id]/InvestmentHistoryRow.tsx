"use client";

import { useState } from "react";
import { EVENT_CATEGORY_OPTIONS, INCOME_CATEGORY_OPTIONS } from "@/lib/finance/investment-instruments";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { updateInvestmentEventEntryAction } from "../actions";

// Formatação local (não importa lib/format.ts) de propósito — esse módulo importa
// `Decimal` de "@/lib/finance/types", que reexporta de "@prisma/client/runtime/client"
// com imports Node-only e já quebrou build de Client Component antes nesta sessão
// (ver lib/finance/investment-instruments.ts, mesmo cuidado).
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
function formatAmount(value: string): string {
  return currencyFormatter.format(Number(value) || 0);
}
function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export interface HistoryRowData {
  id: string;
  investmentId: string;
  /** "AAAA-MM-DD" */
  transactionDate: string;
  nature: "INVESTIMENTO" | "RECEITA";
  categorySlug: string;
  categoryName: string;
  /** String decimal com sinal, ex. "-150.00" */
  amount: string;
  responsibleId: string;
  responsibleName: string;
}

const inputClass =
  "rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs text-zinc-100 disabled:border-transparent disabled:bg-transparent disabled:px-0 disabled:opacity-100";

/**
 * Uma linha do histórico de movimentações de um investimento — Editar/Salvar
 * impacta o `Entry` de verdade por trás (via `updateInvestmentEventEntryAction`),
 * que por sua vez recalcula todos os totais do topo da página no próximo
 * render (são derivados das entries, nunca persistidos — `lib/finance/investment.ts`).
 * Mesmo padrão de `InvestmentEditForm.tsx`/`AssetCard.tsx`: campos sempre
 * renderizados, só `disabled` até clicar "Editar"; estado controlado (não
 * `<form>` + `FormData` do DOM) porque aqui as células vivem dentro de uma
 * `<tr>`, e `<form>` não é filho válido de linha de tabela.
 */
export function InvestmentHistoryRow({ row, people }: { row: HistoryRowData; people: { id: string; name: string }[] }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(row.transactionDate);
  const [categorySlug, setCategorySlug] = useState(row.categorySlug);
  const [responsibleId, setResponsibleId] = useState(row.responsibleId);
  const [amount, setAmount] = useState(row.amount);

  const options = row.nature === "RECEITA" ? INCOME_CATEGORY_OPTIONS : EVENT_CATEGORY_OPTIONS;
  const isNegative = amount.trim().startsWith("-");

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("entryId", row.id);
      fd.set("investmentId", row.investmentId);
      fd.set("date", date);
      fd.set("categorySlug", categorySlug);
      fd.set("responsibleId", responsibleId);
      fd.set("amount", amount);
      await updateInvestmentEventEntryAction(fd);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setDate(row.transactionDate);
    setCategorySlug(row.categorySlug);
    setResponsibleId(row.responsibleId);
    setAmount(row.amount);
    setEditing(false);
    setError(null);
  }

  return (
    <>
      <tr className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
        <td className="px-3 py-2">
          {editing ? (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-36 ${inputClass}`} />
          ) : (
            formatDate(row.transactionDate)
          )}
        </td>
        <td className="px-3 py-2 text-xs text-zinc-400">{row.nature === "RECEITA" ? "Renda" : "Posição"}</td>
        <td className="px-3 py-2 text-xs text-zinc-400">
          {editing ? (
            <select value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className={inputClass}>
              {options.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            row.categoryName
          )}
        </td>
        <td className="px-3 py-2 text-xs text-zinc-400">
          {editing ? (
            <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)} className={inputClass}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            row.responsibleName
          )}
        </td>
        <td className="px-3 py-2 text-right">
          {editing ? (
            <input
              type="number"
              step="0.01"
              min={row.nature === "RECEITA" ? "0" : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-28 text-right font-mono tabular-nums ${inputClass}`}
            />
          ) : (
            <span className={`font-mono tabular-nums ${isNegative ? "text-red-400" : "text-emerald-400"}`}>
              {formatAmount(amount)}
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-right">
          {editing ? (
            <div className="flex justify-end gap-1">
              <button type="button" onClick={handleSave} disabled={saving} className={BTN_PRIMARY}>
                {saving ? "Salvando…" : "Salvar"}
              </button>
              <button type="button" onClick={cancel} disabled={saving} className={BTN_GHOST}>
                Cancelar
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={BTN_GHOST}>
              Editar
            </button>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="px-3 pb-2 text-xs text-red-400">
            {error}
          </td>
        </tr>
      )}
    </>
  );
}
