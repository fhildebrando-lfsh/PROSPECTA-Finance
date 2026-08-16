"use client";

import { useState } from "react";
import { createBenefit, deleteBenefit } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

export interface Option {
  value: string;
  label: string;
}

export interface BenefitView {
  id: string;
  kindLabel: string;
  /** "confirmado", "não tenho" ou "a confirmar" — resolvido no servidor. */
  elegibilidadeLabel: string;
  amountFormatted: string | null;
  durationMonths: number | null;
  availableAfterDays: number | null;
}

export interface PersonBenefitsView {
  id: string;
  name: string;
  regimeLabel: string | null;
  benefits: BenefitView[];
  /** Tipos que fazem sentido para o regime desta pessoa (§23). */
  kindOptions: Option[];
  /** Tipos excluídos pelo regime, para explicar em vez de simplesmente sumir. */
  excluidos: string[];
}

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

export function PersonBenefitsCard({ person }: { person: PersonBenefitsView }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <h3 className="text-sm font-medium text-zinc-100">
        {person.name}
        {person.regimeLabel && <span className="ml-2 text-xs font-normal text-zinc-500">· {person.regimeLabel}</span>}
      </h3>

      {!person.regimeLabel && (
        <p className="mt-2 rounded-lg border border-amber-900/50 bg-amber-950/10 p-2 text-xs text-amber-200">
          Regime de trabalho não informado. Sem ele não dá para saber quais proteções existem — preencha em Perfil de
          Risco.
        </p>
      )}

      {person.excluidos.length > 0 && (
        <p className="mt-2 text-xs text-zinc-500">
          Não se aplica a este regime: {person.excluidos.join(", ")}. Quem é servidor ou militar não tem as proteções
          típicas de CLT — e é justamente por isso que a análise de risco precisa ser diferente.
        </p>
      )}

      {person.benefits.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {person.benefits.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-200">
              <span>
                {b.kindLabel} <span className="text-xs text-zinc-500">· {b.elegibilidadeLabel}</span>
                {b.amountFormatted && <span className="text-xs text-zinc-500"> · {b.amountFormatted}</span>}
                {b.durationMonths && <span className="text-xs text-zinc-500"> · {b.durationMonths} mês(es)</span>}
                {b.availableAfterDays != null && (
                  <span className="text-xs text-zinc-500"> · disponível em {b.availableAfterDays} dias</span>
                )}
              </span>
              <form action={deleteBenefit}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="text-xs text-zinc-500 hover:text-red-400">
                  remover
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 text-xs text-indigo-300 hover:text-white">
          + adicionar proteção
        </button>
      ) : (
        <form
          action={createBenefit}
          onSubmit={() => setAdding(false)}
          className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-800 p-3"
        >
          <input type="hidden" name="personId" value={person.id} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className={LABEL}>
              Proteção
              <select name="kind" required defaultValue="" className={INPUT}>
                <option value="" disabled>
                  — escolha —
                </option>
                {person.kindOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={LABEL}>
              Você tem direito a ela?
              <select name="isEligible" defaultValue="" className={INPUT}>
                <option value="">Ainda não sei</option>
                <option value="sim">Sim, confirmado</option>
                <option value="nao">Não tenho</option>
              </select>
            </label>
            <label className={LABEL}>
              Valor estimado (R$)
              <input name="estimatedAmount" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
            </label>
            <label className={LABEL}>
              Por quantos meses
              <input name="durationMonths" type="number" min="0" placeholder="opcional" className={INPUT} />
            </label>
            <label className={LABEL}>
              Quantos dias até o dinheiro cair
              <input name="availableAfterDays" type="number" min="0" placeholder="opcional" className={INPUT} />
            </label>
          </div>
          <p className="text-[11px] text-zinc-600">
            Só entra no cálculo o que estiver confirmado e com valor. &quot;Ainda não sei&quot; fica registrado, mas o
            sistema não conta com ele — contar com dinheiro incerto é o que faz uma reserva parecer suficiente sem ser.
          </p>
          <div className="flex gap-2">
            <button type="submit" className={`${BTN_SECONDARY} px-2 py-1 text-xs`}>
              Adicionar
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
              cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
