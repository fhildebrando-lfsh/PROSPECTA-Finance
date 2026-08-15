"use client";

import { useState } from "react";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";
import { updateWallet, toggleWalletActive, deleteWallet } from "./actions";
import { WalletReconcileControl, type ReconciliationSummary } from "./WalletReconcileControl";

export interface WalletRow {
  id: string;
  name: string;
  kindLabel: string;
  institutionId: string;
  closingDay: string;
  dueDay: string;
  creditLimit: string;
  isActive: boolean;
  reconciliation: ReconciliationSummary | null;
}

interface InstitutionOption {
  id: string;
  name: string;
}

export function WalletsTable({ wallets, institutions }: { wallets: WalletRow[]; institutions: InstitutionOption[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, notify } = useSavedToast();

  const allSelected = wallets.length > 0 && selected.size === wallets.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(wallets.map((w) => w.id)));
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
    if (!confirm(`Excluir ${selected.size} carteira(s)? Isso não pode ser desfeito.`)) return;
    setBusy(true);
    setError(null);
    try {
      const ids = [...selected];
      const results = await Promise.allSettled(
        ids.map((id) => {
          const fd = new FormData();
          fd.set("id", id);
          return deleteWallet(fd);
        }),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        setError(`${failed} carteira(s) não puderam ser excluídas (já têm lançamentos) — arquive em vez de excluir.`);
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
          <span>{selected.size} selecionada(s)</span>
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
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Instituição</th>
              <th className="px-3 py-2 font-medium">Fecha dia</th>
              <th className="px-3 py-2 font-medium">Vence dia</th>
              <th className="px-3 py-2 font-medium">Limite</th>
              <th className="px-3 py-2 font-medium">Conciliação</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((w) =>
              editingId === w.id ? (
                <WalletEditRow
                  key={w.id}
                  wallet={w}
                  institutions={institutions}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    notify();
                  }}
                  setError={setError}
                />
              ) : (
                <tr
                  key={w.id}
                  className={`border-t border-indigo-900/50 ${w.isActive ? "text-zinc-200" : "text-zinc-500"}`}
                >
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggleOne(w.id)} />
                  </td>
                  <td className="px-3 py-2">{w.name}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{w.kindLabel}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {institutions.find((i) => i.id === w.institutionId)?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{w.closingDay || "—"}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{w.dueDay || "—"}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{w.creditLimit || "—"}</td>
                  <td className="px-3 py-2">
                    <WalletReconcileControl walletId={w.id} latest={w.reconciliation} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => setEditingId(w.id)} className={BTN_SECONDARY}>
                        Editar
                      </button>
                      <form
                        action={async (fd) => {
                          await toggleWalletActive(fd);
                          notify();
                        }}
                      >
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="isActive" value={String(w.isActive)} />
                        <button type="submit" className={BTN_GHOST}>
                          {w.isActive ? "Arquivar" : "Reativar"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WalletEditRow({
  wallet,
  institutions,
  onCancel,
  onSaved,
  setError,
}: {
  wallet: WalletRow;
  institutions: InstitutionOption[];
  onCancel: () => void;
  onSaved: () => void;
  setError: (msg: string | null) => void;
}) {
  const [name, setName] = useState(wallet.name);
  const [institutionId, setInstitutionId] = useState(wallet.institutionId);
  const [closingDay, setClosingDay] = useState(wallet.closingDay);
  const [dueDay, setDueDay] = useState(wallet.dueDay);
  const [creditLimit, setCreditLimit] = useState(wallet.creditLimit);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", wallet.id);
      fd.set("name", name);
      fd.set("institutionId", institutionId);
      fd.set("closingDay", closingDay);
      fd.set("dueDay", dueDay);
      fd.set("creditLimit", creditLimit);
      await updateWallet(fd);
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
          className="w-36 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        />
      </td>
      <td className="px-3 py-2 text-xs text-zinc-400">{wallet.kindLabel}</td>
      <td className="px-3 py-2">
        <select
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        >
          <option value="">— sem instituição —</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={closingDay}
          onChange={(e) => setClosingDay(e.target.value)}
          className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          className="w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={creditLimit}
          onChange={(e) => setCreditLimit(e.target.value)}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
        />
      </td>
      <td className="px-3 py-2"></td>
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
