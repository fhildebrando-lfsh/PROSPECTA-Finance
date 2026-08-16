"use client";

import { useState } from "react";
import { updatePersonRiskProfile, createIncomeSource, deleteIncomeSource } from "./actions";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";

// Sem import de @/lib/format — ele carrega Decimal pro bundle de Client
// Component (gotcha documentado). Todo valor chega pronto do servidor.

export interface IncomeSourceView {
  id: string;
  name: string;
  kindLabel: string;
  employerName: string | null;
  isPrincipal: boolean;
}

export interface PersonRiskView {
  id: string;
  name: string;
  isDependent: boolean;
  regimeTrabalho: string;
  occupation: string;
  cargo: string;
  setor: string;
  cboCode: string;
  tenureCurrentMonths: string;
  experienceTotalMonths: string;
  segundaAtividade: string;
  segundaAtividadeNivel: string;
  /** Já formatado no servidor. */
  rendaObservadaFormatted: string;
  mesesObservados: number;
  confiancaLabel: string;
  incomeSources: IncomeSourceView[];
}

export interface Option {
  value: string;
  label: string;
}

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

export function PersonRiskCard({
  person,
  regimeOptions,
  nivelOptions,
  kindOptions,
}: {
  person: PersonRiskView;
  regimeOptions: Option[];
  nivelOptions: Option[];
  kindOptions: Option[];
}) {
  const [editing, setEditing] = useState(false);
  const [addingIncome, setAddingIncome] = useState(false);

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">
            {person.name}
            {person.isDependent && (
              <span className="ml-2 rounded-full border border-indigo-800 px-2 py-0.5 text-[11px] text-indigo-300">
                dependente
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {person.occupation || "profissão não informada"}
            {person.regimeTrabalho ? ` · ${regimeOptions.find((r) => r.value === person.regimeTrabalho)?.label}` : ""}
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className={`${BTN_SECONDARY} px-2 py-1 text-xs`}>
            Editar perfil
          </button>
        )}
      </div>

      {/* §6 — mostrar o que o sistema já sabe, em vez de perguntar de novo. */}
      <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Renda observada pelo sistema</p>
        <p className="font-mono text-lg tabular-nums text-zinc-100">{person.rendaObservadaFormatted}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          mediana de {person.mesesObservados} mês(es) dos seus lançamentos · confiança {person.confiancaLabel}
        </p>
        <p className="mt-1 text-[11px] text-zinc-600">
          Medido no seu extrato, não declarado — por isso não perguntamos quanto você ganha.
        </p>
      </div>

      {editing && (
        <form action={updatePersonRiskProfile} onSubmit={() => setEditing(false)} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="id" value={person.id} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              Regime de trabalho
              <select name="regimeTrabalho" defaultValue={person.regimeTrabalho} className={INPUT}>
                <option value="">— não informado —</option>
                {regimeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={LABEL}>
              Profissão
              <input name="occupation" defaultValue={person.occupation} className={INPUT} />
            </label>
            <label className={LABEL}>
              Cargo
              <input name="cargo" defaultValue={person.cargo} className={INPUT} />
            </label>
            <label className={LABEL}>
              Setor
              <input name="setor" defaultValue={person.setor} className={INPUT} />
            </label>
            <label className={LABEL}>
              Tempo no vínculo atual (meses)
              <input name="tenureCurrentMonths" type="number" min="0" defaultValue={person.tenureCurrentMonths} className={INPUT} />
            </label>
            <label className={LABEL}>
              Experiência total (meses)
              <input name="experienceTotalMonths" type="number" min="0" defaultValue={person.experienceTotalMonths} className={INPUT} />
            </label>
            <label className={LABEL}>
              Código CBO (opcional)
              <input name="cboCode" defaultValue={person.cboCode} className={INPUT} />
            </label>
          </div>

          <div className="rounded-lg border border-zinc-800 p-3">
            <p className="text-xs font-medium text-zinc-300">Outra atividade capaz de gerar renda</p>
            <p className="mb-2 mt-0.5 text-[11px] text-zinc-500">
              Caso a fonte principal seja interrompida. Só atividade com evidência prática entra nos cenários — uma
              possibilidade teórica não é considerada renda.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={LABEL}>
                Qual atividade
                <input name="segundaAtividade" defaultValue={person.segundaAtividade} className={INPUT} />
              </label>
              <label className={LABEL}>
                Quão real ela é hoje
                <select name="segundaAtividadeNivel" defaultValue={person.segundaAtividadeNivel} className={INPUT}>
                  <option value="">— não informado —</option>
                  {nivelOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input type="checkbox" name="isDependent" defaultChecked={person.isDependent} className="h-4 w-4" />
            É dependente (não gera renda própria)
          </label>

          <div className="flex gap-2">
            <button type="submit" className={BTN_PRIMARY}>
              Salvar
            </button>
            <button type="button" onClick={() => setEditing(false)} className={`${BTN_SECONDARY} px-3 py-1.5`}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-4">
        <p className="text-xs font-medium text-zinc-300">Fontes de renda</p>
        {person.incomeSources.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {person.incomeSources.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-200">
                <span>
                  {s.name} <span className="text-xs text-zinc-500">· {s.kindLabel}</span>
                  {s.employerName && <span className="text-xs text-zinc-500"> · {s.employerName}</span>}
                  {s.isPrincipal && <span className="ml-1 text-[11px] text-amber-300">principal</span>}
                </span>
                <form action={deleteIncomeSource}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-xs text-zinc-500 hover:text-red-400">
                    excluir
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {!addingIncome ? (
          <button
            type="button"
            onClick={() => setAddingIncome(true)}
            className="mt-2 text-xs text-indigo-300 hover:text-white"
          >
            + adicionar fonte de renda
          </button>
        ) : (
          <form
            action={createIncomeSource}
            onSubmit={() => setAddingIncome(false)}
            className="mt-2 flex flex-col gap-2 rounded-lg border border-zinc-800 p-3"
          >
            <input type="hidden" name="personId" value={person.id} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={LABEL}>
                Nome
                <input name="name" required placeholder="ex.: Salário Prefeitura" className={INPUT} />
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
                Quem paga (empregador, cliente principal)
                <input name="employerName" placeholder="opcional" className={INPUT} />
              </label>
              <label className={LABEL}>
                Setor
                <input name="setor" placeholder="opcional" className={INPUT} />
              </label>
            </div>
            <p className="text-[11px] text-zinc-600">
              Quem paga é usado para perceber quando duas rendas da família dependem da mesma empresa — nesse caso elas
              não protegem uma à outra.
            </p>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input type="checkbox" name="isPrincipal" className="h-4 w-4" />
              É a fonte principal desta pessoa
            </label>
            <div className="flex gap-2">
              <button type="submit" className={`${BTN_SECONDARY} px-2 py-1 text-xs`}>
                Adicionar
              </button>
              <button type="button" onClick={() => setAddingIncome(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
                cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
