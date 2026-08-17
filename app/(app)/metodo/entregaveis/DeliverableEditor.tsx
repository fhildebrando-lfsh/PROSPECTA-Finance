"use client";

import { useState } from "react";
import { criarEntregavel, salvarConteudo, validarEntregavel, excluirRascunho } from "./actions";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";

export interface CodeOption {
  value: string;
  label: string;
}

export interface DeliverableView {
  id: string;
  codigo: string;
  nome: string;
  proposito: string;
  versao: number;
  status: string;
  statusLabel: string;
  criadoEm: string;
  validadoEm: string | null;
  nomeNaoConfirmado: boolean;
  faseLabel: string;
  sections: { title: string; body: string }[];
  faltando: string[];
}

export function NovoEntregavelForm({ options }: { options: CodeOption[] }) {
  return (
    <form action={criarEntregavel} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-zinc-400">
        Novo entregável
        <select name="code" required defaultValue="" className={`${INPUT} w-72`}>
          <option value="" disabled>
            — escolha o artefato —
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={BTN_PRIMARY}>
        Criar rascunho
      </button>
    </form>
  );
}

export function DeliverableCard({ d }: { d: DeliverableView }) {
  const [editing, setEditing] = useState(false);
  const rascunho = d.status === "RASCUNHO";

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">
            {d.codigo} — {d.nome}
            <span className="ml-2 text-xs font-normal text-zinc-500">v{d.versao}</span>
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {d.faseLabel} · {d.statusLabel} · criado em {d.criadoEm}
            {d.validadoEm && ` · validado em ${d.validadoEm}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <a href={`/api/metodo/entregavel/${d.id}/pdf`} className="text-indigo-300 hover:text-white">
            Baixar PDF
          </a>
          {rascunho && (
            <form
              action={excluirRascunho}
              onSubmit={(e) => {
                if (!confirm(`Excluir o rascunho ${d.codigo} v${d.versao}?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={d.id} />
              <button type="submit" className="text-zinc-500 hover:text-red-400">
                excluir
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-500">{d.proposito}</p>

      {d.nomeNaoConfirmado && (
        <p className="mt-2 text-[11px] text-amber-300/80">
          O nome completo da sigla {d.codigo} ainda não foi confirmado na documentação do método.
        </p>
      )}

      {!editing ? (
        <>
          <ul className="mt-3 flex flex-col gap-2">
            {d.sections.map((s) => (
              <li key={s.title}>
                <p className="text-xs font-medium text-indigo-300">{s.title}</p>
                <p className={`text-sm ${s.body ? "text-zinc-300" : "text-zinc-600"}`}>
                  {s.body || "(ainda não preenchida)"}
                </p>
              </li>
            ))}
          </ul>

          {rascunho && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setEditing(true)} className={`${BTN_SECONDARY} px-3 py-1.5 text-xs`}>
                Editar
              </button>
              {d.faltando.length === 0 ? (
                <form action={validarEntregavel}>
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className={`${BTN_PRIMARY} px-3 py-1.5 text-xs`}>
                    Validar
                  </button>
                </form>
              ) : (
                <span className="text-[11px] text-amber-300/80">
                  Faltam para validar: {d.faltando.join(", ")}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <form action={salvarConteudo} onSubmit={() => setEditing(false)} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="id" value={d.id} />
          {d.sections.map((s, i) => (
            <label key={s.title} className="flex flex-col gap-1 text-xs text-zinc-400">
              {s.title}
              <textarea name={`section-${i}`} defaultValue={s.body} rows={4} className={INPUT} />
            </label>
          ))}
          <div className="flex gap-2">
            <button type="submit" className={`${BTN_PRIMARY} px-3 py-1.5 text-xs`}>
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={`${BTN_SECONDARY} px-3 py-1.5 text-xs`}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
