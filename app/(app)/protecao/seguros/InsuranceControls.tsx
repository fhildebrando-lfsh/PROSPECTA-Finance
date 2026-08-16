"use client";

import { useState } from "react";
import { createInsurancePolicy, createCoverage, deleteInsurancePolicy, deleteCoverage } from "./actions";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";

// Nenhum import de @/lib/format aqui — ele carrega Decimal pro bundle de
// Client Component (gotcha já documentado). Valores chegam prontos do servidor.

export interface Option {
  value: string;
  label: string;
}

export interface CoverageView {
  id: string;
  riskCovered: string;
  capitalFormatted: string | null;
  deductibleFormatted: string | null;
  waitingPeriodDays: number | null;
  payoutDelayDays: number | null;
}

export interface PolicyView {
  id: string;
  name: string;
  kindLabel: string;
  insurerName: string | null;
  personName: string | null;
  premiumFormatted: string | null;
  coverages: CoverageView[];
}

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

export function NewPolicyForm({ kindOptions, personOptions }: { kindOptions: Option[]; personOptions: Option[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}>
        + Nova apólice
      </button>
    );
  }

  return (
    <form
      action={createInsurancePolicy}
      onSubmit={() => setOpen(false)}
      className="flex flex-col gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4"
    >
      <p className="text-sm font-medium text-zinc-200">Nova apólice</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={LABEL}>
          Nome
          <input name="name" required placeholder="ex.: Seguro do carro" className={INPUT} />
        </label>
        <label className={LABEL}>
          Tipo
          <select name="kind" required defaultValue="" className={INPUT}>
            <option value="" disabled>
              — tipo —
            </option>
            {kindOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Seguradora
          <input name="insurerName" placeholder="opcional" className={INPUT} />
        </label>
        <label className={LABEL}>
          Quem está segurado
          <select name="personId" defaultValue="" className={INPUT}>
            <option value="">— a família toda —</option>
            {personOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Prêmio mensal (R$)
          <input name="premiumMonthly" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={BTN_PRIMARY}>
          Criar
        </button>
        <button type="button" onClick={() => setOpen(false)} className={`${BTN_SECONDARY} px-3 py-1.5`}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function PolicyCard({ policy }: { policy: PolicyView }) {
  const [addingCoverage, setAddingCoverage] = useState(false);

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">
            {policy.name} <span className="text-xs font-normal text-zinc-500">· {policy.kindLabel}</span>
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {policy.insurerName ?? "seguradora não informada"}
            {" · "}
            {policy.personName ?? "protege a família toda"}
            {policy.premiumFormatted ? ` · ${policy.premiumFormatted}/mês` : ""}
          </p>
        </div>
        <form
          action={deleteInsurancePolicy}
          onSubmit={(e) => {
            if (!confirm(`Excluir "${policy.name}" e suas coberturas?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={policy.id} />
          <button type="submit" className="text-xs text-zinc-500 hover:text-red-400">
            excluir
          </button>
        </form>
      </div>

      {policy.coverages.length === 0 ? (
        <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/10 p-2 text-xs text-amber-200">
          Sem cobertura cadastrada — esta apólice ainda não reduz sua necessidade de reserva. É a cobertura, com
          franquia e prazos, que o cálculo usa.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {policy.coverages.map((c) => (
            <li key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-zinc-200">{c.riskCovered}</span>
                <form action={deleteCoverage}>
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="text-xs text-zinc-500 hover:text-red-400">
                    remover
                  </button>
                </form>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {c.capitalFormatted ? `cobre até ${c.capitalFormatted}` : "sem limite informado"}
                {c.deductibleFormatted ? ` · franquia ${c.deductibleFormatted}` : " · sem franquia informada"}
                {c.waitingPeriodDays ? ` · carência ${c.waitingPeriodDays} dias` : ""}
                {c.payoutDelayDays ? ` · paga em ~${c.payoutDelayDays} dias` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!addingCoverage ? (
        <button
          type="button"
          onClick={() => setAddingCoverage(true)}
          className="mt-3 text-xs text-indigo-300 hover:text-white"
        >
          + adicionar cobertura
        </button>
      ) : (
        <form
          action={createCoverage}
          onSubmit={() => setAddingCoverage(false)}
          className="mt-3 flex flex-col gap-2 rounded-lg border border-zinc-800 p-3"
        >
          <input type="hidden" name="policyId" value={policy.id} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className={LABEL}>
              Risco coberto
              <input name="riskCovered" required placeholder="ex.: colisão, morte, invalidez" className={INPUT} />
            </label>
            <label className={LABEL}>
              Capital segurado (R$)
              <input name="capitalInsured" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
            </label>
            <label className={LABEL}>
              Franquia (R$)
              <input name="deductible" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
            </label>
            <label className={LABEL}>
              Carência (dias)
              <input name="waitingPeriodDays" type="number" min="0" placeholder="opcional" className={INPUT} />
            </label>
            <label className={LABEL}>
              Prazo até a indenização cair (dias)
              <input name="payoutDelayDays" type="number" min="0" placeholder="opcional" className={INPUT} />
            </label>
          </div>
          <p className="text-[11px] text-zinc-600">
            O prazo de pagamento importa tanto quanto o valor: uma indenização que chega no terceiro mês não paga a
            conta do primeiro — e é por isso que ela não pode abater a reserva inteira.
          </p>
          <div className="flex gap-2">
            <button type="submit" className={`${BTN_SECONDARY} px-2 py-1 text-xs`}>
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setAddingCoverage(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
