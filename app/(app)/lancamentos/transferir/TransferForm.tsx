"use client";

import { useState } from "react";
import { submitTransfer } from "./actions";

interface WalletOption {
  id: string;
  name: string;
}
interface PersonOption {
  id: string;
  name: string;
}
interface SubcategoryOption {
  id: string;
  name: string;
}

export interface TransferFormProps {
  wallets: WalletOption[];
  people: PersonOption[];
  subcategories: SubcategoryOption[];
  defaultResponsibleId: string;
  todayIso: string;
}

export function TransferForm({ wallets, people, subcategories, defaultResponsibleId, todayIso }: TransferFormProps) {
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [pending, setPending] = useState(false);

  const toOptions = wallets.filter((w) => w.id !== fromWalletId);
  const sameWallet = fromWalletId !== "" && fromWalletId === toWalletId;

  return (
    <form
      action={submitTransfer}
      onSubmit={() => setPending(true)}
      className="mx-auto flex max-w-sm flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">
            Origem <span className="text-red-400">*</span>
          </span>
          <select
            name="fromWalletId"
            value={fromWalletId}
            onChange={(e) => {
              setFromWalletId(e.target.value);
              if (e.target.value === toWalletId) setToWalletId("");
            }}
            required
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
          >
            <option value="">—</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">
            Destino <span className="text-red-400">*</span>
          </span>
          <select
            name="toWalletId"
            value={toWalletId}
            onChange={(e) => setToWalletId(e.target.value)}
            required
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
          >
            <option value="">—</option>
            {toOptions.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sameWallet && <p className="text-xs text-red-400">Origem e destino precisam ser diferentes.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">
          Valor <span className="text-red-400">*</span>
        </span>
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          placeholder="0,00"
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-2xl font-mono text-zinc-50"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">
          Data <span className="text-red-400">*</span>
        </span>
        <input
          name="date"
          type="date"
          defaultValue={todayIso}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
        />
      </label>

      {subcategories.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">Subcategoria (opcional)</span>
          <select
            name="subcategoryId"
            defaultValue=""
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
          >
            <option value="">—</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">
          Responsável <span className="text-red-400">*</span>
        </span>
        <select
          name="responsibleId"
          defaultValue={defaultResponsibleId}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
        >
          <option value="">—</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Descrição (opcional)</span>
        <input
          name="description"
          placeholder="Transferência entre carteiras"
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </label>

      <button
        type="submit"
        disabled={pending || sameWallet}
        className="mt-2 rounded-xl bg-amber-500 py-3 text-base font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Transferir"}
      </button>
    </form>
  );
}
