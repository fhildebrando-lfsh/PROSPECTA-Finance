"use client";

import { useMemo, useState } from "react";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { CurrencyInputBRL } from "@/components/ui/CurrencyInputBRL";
import { DETAIL_FIELDS_BY_CLASS, INSTRUMENT_SUGGESTIONS_BY_CLASS } from "@/lib/finance/investment-instruments";
import { createInvestmentAction } from "../actions";

interface ClassOption {
  code: string;
  labelPt: string;
  groupLabel: string;
}
interface WalletOption {
  id: string;
  name: string;
}
interface PersonOption {
  id: string;
  name: string;
}

export function NewInvestmentForm({
  classes,
  wallets,
  people,
}: {
  classes: ClassOption[];
  wallets: WalletOption[];
  people: PersonOption[];
}) {
  const [classCode, setClassCode] = useState(classes[0]?.code ?? "");

  const detailFields = useMemo(() => DETAIL_FIELDS_BY_CLASS[classCode] ?? [], [classCode]);
  const instrumentSuggestions = useMemo(() => INSTRUMENT_SUGGESTIONS_BY_CLASS[classCode] ?? [], [classCode]);

  const groupedClasses = useMemo(() => {
    const groups = new Map<string, ClassOption[]>();
    for (const c of classes) {
      const list = groups.get(c.groupLabel) ?? [];
      list.push(c);
      groups.set(c.groupLabel, list);
    }
    return Array.from(groups.entries());
  }, [classes]);

  // action={createInvestmentAction} direto (não onSubmit+try/catch): a action redireciona
  // pro detalhe do investimento criado no sucesso — envolver a chamada em try/catch do
  // lado do cliente interceptaria esse redirect como se fosse um erro (mesmo mecanismo
  // interno do Next.js pra Server Actions que redirecionam). Erro de validação vira a
  // página de erro padrão do Next — aceitável aqui, mesmo padrão já usado em
  // `cartoes/novo/page.tsx`.
  return (
    <form action={createInvestmentAction} className="flex flex-col gap-6">
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">O que você está investindo</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome *
            <input
              name="name"
              required
              placeholder='Ex.: "PETR4", "Tesouro IPCA+ 2029", "Apê Rua X"'
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Classe *
            <select
              name="classCode"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            >
              {groupedClasses.map(([groupLabel, options]) => (
                <optgroup key={groupLabel} label={groupLabel}>
                  {options.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.labelPt}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
            Tipo específico
            <input
              name="instrumentType"
              list="instrument-suggestions"
              placeholder="Ex.: CDB, Ações, Apartamento..."
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
            <datalist id="instrument-suggestions">
              {instrumentSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          {detailFields.map((field) => (
            <label key={field.name} className="flex flex-col gap-1 text-xs text-zinc-400">
              {field.label}
              <input
                type={field.type ?? "text"}
                name={field.name}
                placeholder={field.placeholder}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Onde a posição mora</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Carteira (corretora, ou o próprio imóvel/veículo/empresa)
            <select name="walletId" defaultValue="" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              <option value="">— selecione —</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Não achou? Digite o nome (cria uma carteira nova)
            <input
              name="newWalletName"
              placeholder="Deixe em branco se já selecionou acima"
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Responsável *
            <select name="responsibleId" required defaultValue="" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              <option value="">— selecione —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Aporte inicial</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data *
            <input
              type="date"
              name="acquisitionDate"
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Valor aportado (R$) *
            <CurrencyInputBRL name="acquisitionAmount" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100" />
          </label>
        </div>
      </div>

      <button type="submit" className={`self-start ${BTN_PRIMARY}`}>
        Criar investimento
      </button>
    </form>
  );
}
