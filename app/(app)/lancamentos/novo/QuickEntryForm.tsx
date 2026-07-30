"use client";

import { useState } from "react";
import { createQuickEntry } from "./actions";

interface WalletOption {
  id: string;
  name: string;
  kindCode: string;
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
interface CodeLabel {
  code: string;
  label: string;
}

export interface QuickEntryFormProps {
  wallets: WalletOption[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  people: PersonOption[];
  recurrenceKinds: CodeLabel[];
  statuses: CodeLabel[];
  defaultWalletId: string;
  defaultResponsibleId: string;
  /** walletId -> dueDate (AAAA-MM-DD) da fatura vigente, só para carteiras de cartão de crédito (§12). */
  cardDueDates: Record<string, string>;
  todayIso: string;
}

export function QuickEntryForm({
  wallets,
  categories,
  subcategories,
  people,
  recurrenceKinds,
  statuses,
  defaultWalletId,
  defaultResponsibleId,
  cardDueDates,
  todayIso,
}: QuickEntryFormProps) {
  const [nature, setNature] = useState<"DESPESA" | "RECEITA">("DESPESA");
  const [walletId, setWalletId] = useState(defaultWalletId);
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [responsibleId, setResponsibleId] = useState(defaultResponsibleId);
  const [statusCode, setStatusCode] = useState(() => defaultStatusFor(walletId, wallets, statuses));
  const [description, setDescription] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [pending, setPending] = useState(false);

  const wallet = wallets.find((w) => w.id === walletId);
  const isCard = wallet?.kindCode === "CARTAO_CREDITO";
  const dueDate = isCard ? cardDueDates[walletId] ?? todayIso : todayIso;

  const availableCategories = categories.filter((c) => c.nature === nature);
  const availableSubcategories = subcategories.filter((s) => s.categoryId === categoryId);

  function handleWalletChange(id: string) {
    setWalletId(id);
    setStatusCode(defaultStatusFor(id, wallets, statuses));
  }

  function handleNatureChange(next: "DESPESA" | "RECEITA") {
    setNature(next);
    setCategoryId("");
    setSubcategoryId("");
  }

  async function handleDescriptionBlur() {
    if (!description.trim()) return;
    try {
      const res = await fetch(`/api/entries/suggest-category?description=${encodeURIComponent(description.trim())}`);
      const json = await res.json();
      const suggestion = json.suggestion as { categoryId: string; subcategoryId: string | null } | null;
      if (!suggestion) return;
      const category = categories.find((c) => c.id === suggestion.categoryId);
      if (!category || category.nature !== nature) return; // não sugere categoria de outra natureza
      setCategoryId(suggestion.categoryId);
      setSubcategoryId(suggestion.subcategoryId ?? "");
    } catch {
      // sugestão é conveniência, não crítico — falha em silêncio
    }
  }

  return (
    <form
      action={createQuickEntry}
      onSubmit={() => setPending(true)}
      className="mx-auto flex max-w-sm flex-col gap-4"
    >
      <input type="hidden" name="transactionDate" value={todayIso} />
      <input type="hidden" name="dueDate" value={dueDate} />
      <input type="hidden" name="statusCode" value={statusCode} />
      {/* sempre presente, mesmo com "mais opções" fechado — o select visível fica lá dentro */}
      <input type="hidden" name="responsibleId" value={responsibleId} />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Valor</span>
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          autoFocus
          placeholder="0,00"
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-2xl font-mono text-zinc-50"
        />
      </label>

      <div className="flex overflow-hidden rounded-lg border border-zinc-700 text-sm">
        <button
          type="button"
          onClick={() => handleNatureChange("DESPESA")}
          className={`flex-1 py-2 ${nature === "DESPESA" ? "bg-red-500 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => handleNatureChange("RECEITA")}
          className={`flex-1 py-2 ${nature === "RECEITA" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}
        >
          Receita
        </button>
      </div>
      <input type="hidden" name="nature" value={nature} />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">Carteira</span>
          <select
            name="walletId"
            value={walletId}
            onChange={(e) => handleWalletChange(e.target.value)}
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
          <span className="text-xs text-zinc-400">Categoria</span>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
            required
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
          >
            <option value="">—</option>
            {availableCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {availableSubcategories.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-xs text-zinc-400">Subcategoria</span>
          <select
            name="subcategoryId"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
          >
            <option value="">—</option>
            {availableSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-zinc-400">Descrição (opcional)</span>
        <input
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </label>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="text-left text-xs text-zinc-500 hover:text-zinc-300"
      >
        {showMore ? "− menos opções" : "+ mais opções"}
      </button>

      {showMore && (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 p-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Responsável</span>
            <select
              value={responsibleId}
              onChange={(e) => setResponsibleId(e.target.value)}
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
            <span className="text-xs text-zinc-400">Situação</span>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
            >
              {statuses.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Recorrência</span>
            <select
              name="recurrenceCode"
              defaultValue="UNICA"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
            >
              {recurrenceKinds.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Parcelas (1 = à vista)</span>
            <input
              name="installmentsTotal"
              type="number"
              min={1}
              defaultValue={1}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Observação</span>
            <textarea
              name="note"
              rows={2}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
            />
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-xl bg-amber-500 py-3 text-base font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}

function defaultStatusFor(walletId: string, wallets: WalletOption[], statuses: CodeLabel[]): string {
  const wallet = wallets.find((w) => w.id === walletId);
  const wanted = wallet?.kindCode === "CARTAO_CREDITO" ? "A_PAGAR" : "PAGO";
  return statuses.find((s) => s.code === wanted)?.code ?? statuses[0]?.code ?? "";
}
