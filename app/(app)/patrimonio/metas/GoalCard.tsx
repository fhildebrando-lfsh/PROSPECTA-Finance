"use client";

import { useState } from "react";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { ReserveGauge } from "@/components/charts/ReserveGauge";
import { archiveGoal, deleteGoal, toggleGoalPinned, updateGoal } from "./actions";

export interface GoalCardData {
  id: string;
  name: string;
  walletName: string;
  /** Já formatados em texto pelo server component — nunca `Decimal` cruzando para o client. */
  balanceFormatted: string;
  targetAmountFormatted: string;
  /** Valor numérico puro, só para pré-preencher o campo de edição. */
  targetAmountRaw: number;
  /** ISO `AAAA-MM-DD` ou vazio — idem, só para pré-preencher o `<input type="date">`. */
  targetDateIso: string;
  targetDateFormatted: string | null;
  progress: number;
  isActive: boolean;
  pinnedToPainel: boolean;
}

/** Card de uma meta — mesma trava de edição de `AssetCard` (view/edição via
 * `useState`, Server Action chamada como função assíncrona). O checkbox
 * "Mostrar no Painel" fica fora da trava — é preferência de exibição, não
 * dado da meta. */
export function GoalCard({ goal }: { goal: GoalCardData }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmountRaw));
  const [targetDate, setTargetDate] = useState(goal.targetDateIso);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinned, setPinned] = useState(goal.pinnedToPainel);
  const [pinning, setPinning] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", goal.id);
      fd.set("name", name);
      fd.set("targetAmount", targetAmount);
      fd.set("targetDate", targetDate);
      await updateGoal(fd);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setName(goal.name);
    setTargetAmount(String(goal.targetAmountRaw));
    setTargetDate(goal.targetDateIso);
    setEditing(false);
    setError(null);
  }

  async function togglePinned() {
    setPinned((v) => !v); // otimista
    setPinning(true);
    try {
      const fd = new FormData();
      fd.set("id", goal.id);
      fd.set("pinnedToPainel", String(pinned));
      await toggleGoalPinned(fd);
    } catch {
      setPinned((v) => !v); // desfaz se falhou
    } finally {
      setPinning(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4 ${goal.isActive ? "" : "opacity-50"}`}
    >
      <div className="flex items-center justify-between gap-1">
        <h2 className="min-w-0 truncate text-sm font-medium text-zinc-100">{goal.name}</h2>
        <div className="flex shrink-0 gap-1">
          <form action={archiveGoal}>
            <input type="hidden" name="id" value={goal.id} />
            <input type="hidden" name="isActive" value={String(goal.isActive)} />
            <button type="submit" className={BTN_GHOST}>
              {goal.isActive ? "Arquivar" : "Reativar"}
            </button>
          </form>
          <form action={deleteGoal}>
            <input type="hidden" name="id" value={goal.id} />
            <button type="submit" className={BTN_DANGER}>
              Excluir
            </button>
          </form>
        </div>
      </div>

      <label className="flex items-center justify-center gap-2 text-xs text-indigo-300">
        <input type="checkbox" checked={pinned} disabled={pinning} onChange={togglePinned} className="accent-amber-500" />
        Mostrar no Painel
      </label>

      <div className="flex flex-col items-center">
        <ReserveGauge percentage={goal.progress} label={goal.name.toUpperCase()} />
      </div>

      <p className="text-center text-xs text-indigo-300">
        {goal.walletName} · {goal.balanceFormatted} de {goal.targetAmountFormatted}
        {goal.targetDateFormatted ? ` · até ${goal.targetDateFormatted}` : ""}
      </p>

      {editing ? (
        <div className="flex flex-wrap items-end justify-center gap-2 border-t border-indigo-900/50 pt-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Valor-alvo
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data-alvo
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
            />
          </label>
          <button type="button" disabled={saving} onClick={save} className={BTN_PRIMARY}>
            {saving ? "…" : "Salvar"}
          </button>
          <button type="button" onClick={cancel} className={BTN_GHOST}>
            Cancelar
          </button>
          {error && <p className="w-full text-center text-xs text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex justify-center border-t border-indigo-900/50 pt-3">
          <button type="button" onClick={() => setEditing(true)} className={BTN_GHOST}>
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
