"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeIncidentsBulk } from "./actions";
import { IncidentCard, type IncidentCardData } from "./IncidentCard";

interface WalletOption {
  id: string;
  name: string;
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

export function IncidentsList({
  cards,
  wallets,
  categories,
  subcategories,
  people,
  statuses,
}: {
  cards: IncidentCardData[];
  wallets: WalletOption[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  people: PersonOption[];
  statuses: StatusOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allSelected = cards.length > 0 && selected.size === cards.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(cards.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkConfirm() {
    if (selected.size === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await acknowledgeIncidentsBulk([...selected]);
      setMessage(
        result.confirmed === result.total
          ? `${result.confirmed} incidente(s) confirmado(s).`
          : `${result.confirmed} de ${result.total} confirmados — o resto já não estava mais pendente.`,
      );
      setSelected(new Set());
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-xs text-zinc-500">
        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
        Selecionar todos ({cards.length})
      </label>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          <span>{selected.size} selecionado(s)</span>
          <button
            type="button"
            disabled={busy}
            onClick={bulkConfirm}
            className="rounded-lg border border-emerald-700 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900 disabled:opacity-50"
          >
            {busy ? "Confirmando…" : "Confirmar selecionados"}
          </button>
        </div>
      )}
      {message && <p className="text-sm text-zinc-400">{message}</p>}

      {cards.map((card) => (
        <IncidentCard
          key={card.id}
          data={card}
          wallets={wallets}
          categories={categories}
          subcategories={subcategories}
          people={people}
          statuses={statuses}
          selected={selected.has(card.id)}
          onToggleSelect={() => toggleOne(card.id)}
        />
      ))}
    </div>
  );
}
