"use client";

import { useRef, useState } from "react";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { CurrencyInputBRL } from "@/components/ui/CurrencyInputBRL";
import { DayInput } from "@/components/ui/DayInput";
import { updateCreditCard } from "./actions";

export interface CardEditFormData {
  id: string;
  name: string;
  institutionId: string | null;
  closingDay: number | null;
  dueDay: number | null;
  creditLimit: string | null;
  annualFee: string | null;
  annualFeeWaiverNote: string;
  rewardsProgramName: string;
  pointsPerRealSpent: string;
  pointValueEstimateBRL: string;
  hasImage: boolean;
}

interface InstitutionOption {
  id: string;
  name: string;
}

/**
 * Formulário "Editar cartão" — trava a edição até clicar em "Editar" (mesmo padrão já
 * usado em `AssetCard.tsx`/`GoalCard.tsx`): campos desabilitados fora do modo de edição,
 * botão Editar → Salvar/Cancelar. `DayInput`/`CurrencyInputBRL` mantêm estado React
 * próprio (não são inputs "burros"), então `form.reset()` sozinho não os restaura ao
 * cancelar — por isso o `key` deles muda a cada cancelamento, forçando remontagem com o
 * `defaultValue` original (truque padrão do React pra "resetar" um input controlado).
 */
export function CardEditForm({ wallet, institutions }: { wallet: CardEditFormData; institutions: InstitutionOption[] }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateCreditCard(new FormData(formRef.current!));
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    formRef.current?.reset();
    setResetKey((k) => k + 1);
    setEditing(false);
    setError(null);
  }

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Editar cartão</h2>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className={BTN_GHOST}>
            Editar
          </button>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="walletId" value={wallet.id} />

        {error && <p className="text-xs text-red-400 sm:col-span-2">{error}</p>}

        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Nome do cartão *
          <input
            name="name"
            defaultValue={wallet.name}
            required
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Instituição financeira
          <select
            name="institutionId"
            defaultValue={wallet.institutionId ?? ""}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          >
            <option value="">— selecione —</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
          Não achou o banco? Digite o nome (cria uma instituição nova)
          <input
            name="newInstitutionName"
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Dia de fechamento *
          <DayInput
            key={`closingDay-${resetKey}`}
            name="closingDay"
            defaultValue={wallet.closingDay}
            required
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Dia de vencimento *
          <DayInput
            key={`dueDay-${resetKey}`}
            name="dueDay"
            defaultValue={wallet.dueDay}
            required
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Limite de crédito (R$)
          <CurrencyInputBRL
            key={`creditLimit-${resetKey}`}
            name="creditLimit"
            defaultValue={wallet.creditLimit}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Anuidade (R$/ano)
          <CurrencyInputBRL
            key={`annualFee-${resetKey}`}
            name="annualFee"
            defaultValue={wallet.annualFee}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Condição de isenção da anuidade
          <input
            name="annualFeeWaiverNote"
            defaultValue={wallet.annualFeeWaiverNote}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Programa de pontos/milhas
          <input
            name="rewardsProgramName"
            defaultValue={wallet.rewardsProgramName}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Pontos por R$ gasto
          <input
            type="number"
            name="pointsPerRealSpent"
            min="0"
            step="0.0001"
            defaultValue={wallet.pointsPerRealSpent}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Valor estimado de cada ponto (R$)
          <input
            type="number"
            name="pointValueEstimateBRL"
            min="0"
            step="0.0001"
            defaultValue={wallet.pointValueEstimateBRL}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
          Trocar imagem (PNG, JPEG ou WebP, até 2MB)
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60 file:mr-2 file:rounded file:border-0 file:bg-indigo-500/20 file:px-2 file:py-1 file:text-indigo-100"
          />
        </label>
        {wallet.hasImage && (
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="removeImage" value="true" disabled={!editing} />
            Remover imagem atual
          </label>
        )}

        {editing && (
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className={BTN_PRIMARY}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" onClick={cancel} disabled={saving} className={BTN_GHOST}>
              Cancelar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
