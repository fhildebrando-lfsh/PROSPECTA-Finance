"use client";

import { useMemo, useState } from "react";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { acknowledgeIncident, updateIncidentEntry } from "./actions";

export interface IncidentCardData {
  id: string;
  description: string;
  walletId: string;
  categoryId: string;
  subcategoryId: string;
  responsibleId: string;
  nature: string;
  statusCode: string;
  amountAbs: string;
  isNegative: boolean;
  amountFormatted: string;
  transactionDateIso: string;
  dueDateIso: string;
  dueDateFormatted: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
  walletName: string;
  categoryName: string;
  responsibleName: string;
  motivo: string;
}

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

interface IncidentCardProps {
  data: IncidentCardData;
  wallets: WalletOption[];
  categories: CategoryOption[];
  subcategories: SubcategoryOption[];
  people: PersonOption[];
  statuses: StatusOption[];
  selected?: boolean;
  onToggleSelect?: () => void;
}

const FREE_SIGN_NATURES = new Set(["INVESTIMENTO", "OUTRO"]);

export function IncidentCard({
  data,
  wallets,
  categories,
  subcategories,
  people,
  statuses,
  selected = false,
  onToggleSelect,
}: IncidentCardProps) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [walletId, setWalletId] = useState(data.walletId);
  const [categoryId, setCategoryId] = useState(data.categoryId);
  const [subcategoryId, setSubcategoryId] = useState(data.subcategoryId);
  const [responsibleId, setResponsibleId] = useState(data.responsibleId);
  const [description, setDescription] = useState(data.description);
  const [statusCode, setStatusCode] = useState(data.statusCode);
  const [transactionDate, setTransactionDate] = useState(data.transactionDateIso);
  const [dueDate, setDueDate] = useState(data.dueDateIso);
  const [absAmount, setAbsAmount] = useState(data.amountAbs);
  const [negative, setNegative] = useState(data.isNegative);
  const [installmentNumber, setInstallmentNumber] = useState(String(data.installmentNumber ?? ""));
  const [installmentTotal, setInstallmentTotal] = useState(String(data.installmentTotal ?? ""));

  const availableCategories = useMemo(() => categories.filter((c) => c.nature === data.nature), [categories, data.nature]);
  const availableSubcategories = useMemo(
    () => subcategories.filter((s) => s.categoryId === categoryId),
    [subcategories, categoryId],
  );
  const freeSign = FREE_SIGN_NATURES.has(data.nature);

  function resetToView() {
    setWalletId(data.walletId);
    setCategoryId(data.categoryId);
    setSubcategoryId(data.subcategoryId);
    setResponsibleId(data.responsibleId);
    setDescription(data.description);
    setStatusCode(data.statusCode);
    setTransactionDate(data.transactionDateIso);
    setDueDate(data.dueDateIso);
    setAbsAmount(data.amountAbs);
    setNegative(data.isNegative);
    setInstallmentNumber(String(data.installmentNumber ?? ""));
    setInstallmentTotal(String(data.installmentTotal ?? ""));
    setEditing(false);
    setError(null);
  }

  async function handleAcknowledge() {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", data.id);
      await acknowledgeIncident(fd);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(acknowledge: boolean) {
    setBusy(true);
    setError(null);
    try {
      const abs = Math.abs(Number(absAmount) || 0);
      const signed = data.nature === "DESPESA" ? -abs : data.nature === "RECEITA" ? abs : negative ? -abs : abs;

      const fd = new FormData();
      fd.set("id", data.id);
      fd.set("walletId", walletId);
      fd.set("categoryId", categoryId);
      fd.set("subcategoryId", subcategoryId);
      fd.set("responsibleId", responsibleId);
      fd.set("description", description.trim() || "(sem descrição)");
      fd.set("statusCode", statusCode);
      fd.set("transactionDate", transactionDate);
      fd.set("dueDate", dueDate);
      fd.set("amount", signed.toFixed(2));
      fd.set("installmentNumber", installmentNumber);
      fd.set("installmentTotal", installmentTotal);
      fd.set("acknowledge", acknowledge ? "1" : "0");
      await updateIncidentEntry(fd);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-800 bg-amber-950/20 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              disabled={editing}
              className="mt-1 shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">{data.description}</p>
            <p className="mt-0.5 text-xs text-amber-300">{data.motivo}</p>
          </div>
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={handleAcknowledge} disabled={busy} className={BTN_GHOST}>
              Confirmar que está correto
            </button>
            <button type="button" onClick={() => setEditing(true)} disabled={busy} className={BTN_PRIMARY}>
              Editar
            </button>
          </div>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      {!editing ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-zinc-500">Carteira</dt>
            <dd className="text-zinc-200">{data.walletName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Categoria</dt>
            <dd className="text-zinc-200">{data.categoryName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Responsável</dt>
            <dd className="text-zinc-200">{data.responsibleName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Vencimento</dt>
            <dd className="text-zinc-200">{data.dueDateFormatted}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Valor</dt>
            <dd className={data.isNegative ? "text-red-400" : "text-emerald-400"}>{data.amountFormatted}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Parcela</dt>
            <dd className="text-zinc-200">
              {data.installmentNumber ?? "—"}/{data.installmentTotal ?? "—"}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Carteira
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Categoria
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Subcategoria
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              >
                <option value="">—</option>
                {availableSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Responsável
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Situação
              <select
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              >
                {statuses.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Descrição
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Data da compra
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Vencimento
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Valor
              <div className="flex items-center gap-1">
                {freeSign && (
                  <button
                    type="button"
                    onClick={() => setNegative((v) => !v)}
                    className="rounded border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300"
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
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Nº da parcela
              <input
                type="number"
                min="1"
                value={installmentNumber}
                onChange={(e) => setInstallmentNumber(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-400">
              Total de parcelas
              <input
                type="number"
                min="1"
                value={installmentTotal}
                onChange={(e) => setInstallmentTotal(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
              <span className="text-[11px] text-zinc-600">Menos de 2 = deixa de ser tratado como parcelamento.</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => handleSave(false)} disabled={busy} className={BTN_GHOST}>
              {busy ? "Salvando…" : "Salvar"}
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={busy}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy ? "Salvando…" : "Salvar e Confirmar"}
            </button>
            <button type="button" onClick={resetToView} disabled={busy} className={BTN_GHOST}>
              Cancelar
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            &ldquo;Salvar&rdquo; grava as correções e mantém a linha pendente pra você conferir depois. &ldquo;Salvar
            e Confirmar&rdquo; grava e já tira a linha desta lista.
          </p>
        </div>
      )}
    </div>
  );
}
