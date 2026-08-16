"use client";

import { useState } from "react";
import { conciliateWallet } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

// Formatação local, não importada de @/lib/format — esse módulo importa
// Decimal de @/lib/finance/types, que não pode ir pro bundle de Client
// Component (gotcha já documentado, ver InvestmentHistoryRow.tsx/AssetCard.tsx).
const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

export interface ReconciliationSummary {
  declaredBalance: string;
  systemBalance: string;
  checkedAt: string; // ISO — Client Component não recebe Date/Decimal do servidor
}

/**
 * Etapa 2 do Método (2026-08-15) — captura de saldo declarado pro
 * componente de Conciliação do Índice de Consistência. Mesmo padrão visual
 * de AdvisorControl: rótulo + botão que revela um form inline.
 */
export function WalletReconcileControl({
  walletId,
  latest,
}: {
  walletId: string;
  latest: ReconciliationSummary | null;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    if (!latest) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
          nunca conferida
          <button type="button" onClick={() => setOpen(true)} className="text-indigo-300 hover:text-white">
            conferir
          </button>
        </span>
      );
    }

    const diff = Number(latest.declaredBalance) - Number(latest.systemBalance);
    const bate = Math.abs(diff) < 0.01;

    return (
      <span className="inline-flex flex-col gap-0.5 text-xs">
        <span className={bate ? "text-emerald-400" : "text-amber-400"}>
          {bate ? "confere" : `diferença de ${currencyFormatter.format(Math.abs(diff))}`}
        </span>
        <span className="text-zinc-500">
          declarado {currencyFormatter.format(Number(latest.declaredBalance))} em{" "}
          {dateFormatter.format(new Date(latest.checkedAt))}{" "}
          <button type="button" onClick={() => setOpen(true)} className="text-indigo-300 hover:text-white">
            conferir de novo
          </button>
        </span>
      </span>
    );
  }

  return (
    <form action={conciliateWallet} onSubmit={() => setOpen(false)} className="inline-flex items-center gap-1.5">
      <input type="hidden" name="walletId" value={walletId} />
      <input
        name="declaredBalance"
        type="number"
        step="0.01"
        placeholder="saldo real"
        required
        className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
      />
      <button type="submit" className={`${BTN_SECONDARY} px-2 py-0.5 text-xs`}>
        Salvar
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
        cancelar
      </button>
    </form>
  );
}
