"use client";

import { useState } from "react";
import { registrarChoque } from "./actions";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

export interface Option {
  value: string;
  label: string;
}

/**
 * §13 — a pergunta que a especificação sugere fazer está no cabeçalho da tela:
 * "qual foi a maior despesa essencial inesperada dos últimos 24 meses?". Aqui
 * o formulário só coleta o que o motor consome, sem pedir nada além.
 */
export function ShockForm({ kindOptions, personOptions }: { kindOptions: Option[]; personOptions: Option[] }) {
  const [open, setOpen] = useState(false);
  const [seguro, setSeguro] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={BTN_PRIMARY}>
        + Registrar um evento
      </button>
    );
  }

  return (
    <form
      action={registrarChoque}
      onSubmit={() => setOpen(false)}
      className="flex flex-col gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4"
    >
      <p className="text-sm font-medium text-zinc-200">Registrar um evento</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={LABEL}>
          O que aconteceu
          <input name="description" required placeholder="ex.: troca do motor do carro" className={INPUT} />
        </label>
        <label className={LABEL}>
          Tipo
          <select name="kind" required defaultValue="" className={INPUT}>
            <option value="" disabled>
              — escolha —
            </option>
            {kindOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Quando
          <input name="occurredAt" type="date" required className={INPUT} />
        </label>
        <label className={LABEL}>
          Quem foi afetado
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
          Despesa extraordinária (R$)
          <input name="extraordinaryExpense" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
        </label>
        <label className={LABEL}>
          Perda de renda por mês (R$)
          <input name="incomeLossMonthly" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
        </label>
        <label className={LABEL}>
          Durou quantos meses
          <input name="durationMonths" type="number" min="0" placeholder="opcional" className={INPUT} />
        </label>
        <label className={LABEL}>
          Quanto saiu da sua reserva (R$)
          <input name="reserveUsedAmount" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
        </label>
        <label className={LABEL}>
          Tinha seguro?
          <select name="hadInsurance" defaultValue="" onChange={(e) => setSeguro(e.target.value)} className={INPUT}>
            <option value="">Não informado</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </label>
        {seguro === "sim" && (
          <>
            <label className={LABEL}>
              Quanto o seguro reembolsou (R$)
              <input name="reimbursedAmount" type="number" step="0.01" min="0" className={INPUT} />
            </label>
            <label className={LABEL}>
              Quantos dias até o reembolso cair
              <input name="daysUntilReimbursement" type="number" min="0" className={INPUT} />
            </label>
          </>
        )}
        <label className={LABEL}>
          Quanto saiu do seu bolso (R$)
          <input name="paidByUserAmount" type="number" step="0.01" min="0" placeholder="opcional" className={INPUT} />
        </label>
      </div>

      <p className="text-[11px] text-zinc-600">
        &quot;Não informado&quot; é uma resposta válida e diferente de &quot;não&quot; — o cálculo não conta com o que
        você não confirmou.
      </p>

      <div className="flex gap-2">
        <button type="submit" className={BTN_PRIMARY}>
          Registrar
        </button>
        <button type="button" onClick={() => setOpen(false)} className={`${BTN_SECONDARY} px-3 py-1.5`}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
