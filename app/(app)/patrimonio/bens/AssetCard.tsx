"use client";

import { useState } from "react";
import Link from "next/link";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { archiveAsset, deleteAssetAction, updateAssetAction } from "./actions";

export interface AssetCardData {
  id: string;
  name: string;
  categoryId: string;
  /** Já formatado em texto pelo server component — nunca `Decimal` cruzando para o
   * client (é a causa do bug de build já visto uma vez nesta sessão, `BudgetTable`). */
  currentValueFormatted: string;
  isActive: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
}

/**
 * Card de um bem — trava a edição até clicar em "Editar" (mesmo padrão já
 * usado em `WalletsTable.tsx`/`WalletEditRow` nos Cadastros): view/edição via
 * `useState`, chama a Server Action como função assíncrona direto do
 * `onClick`, não como `action` de formulário — dá controle de quando sair do
 * modo de edição.
 */
export function AssetCard({ asset, categories }: { asset: AssetCardData; categories: CategoryOption[] }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const [categoryId, setCategoryId] = useState(asset.categoryId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("id", asset.id);
      fd.set("name", name);
      fd.set("categoryId", categoryId);
      await updateAssetAction(fd);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setName(asset.name);
    setCategoryId(asset.categoryId);
    setEditing(false);
    setError(null);
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4 ${asset.isActive ? "" : "opacity-50"}`}
    >
      <div className="flex items-center justify-between gap-1">
        <Link
          href={`/patrimonio/bens/${asset.id}`}
          className="min-w-0 truncate text-sm font-medium text-indigo-300 hover:text-white hover:underline"
        >
          {asset.name}
        </Link>
        <div className="flex shrink-0 gap-1">
          <form action={archiveAsset}>
            <input type="hidden" name="id" value={asset.id} />
            <input type="hidden" name="isActive" value={String(asset.isActive)} />
            <button type="submit" className={BTN_GHOST}>
              {asset.isActive ? "Arquivar" : "Reativar"}
            </button>
          </form>
          <form action={deleteAssetAction}>
            <input type="hidden" name="id" value={asset.id} />
            <button type="submit" className={BTN_DANGER}>
              Excluir
            </button>
          </form>
        </div>
      </div>

      <p className="text-center font-mono text-xl tabular-nums text-zinc-100">{asset.currentValueFormatted}</p>
      <p className="text-center text-xs text-indigo-300">
        <Link href={`/patrimonio/bens/${asset.id}`} className="underline-offset-2 hover:underline">
          Ver histórico
        </Link>
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
            Categoria
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
