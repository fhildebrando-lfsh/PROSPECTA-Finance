"use client";

import { useMemo, useRef, useState } from "react";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { DETAIL_FIELDS_BY_CLASS, INSTRUMENT_SUGGESTIONS_BY_CLASS } from "@/lib/finance/investment-instruments";
import { updateInvestmentAction } from "./actions";

export interface InvestmentEditFormData {
  id: string;
  name: string;
  classCode: string;
  details: Record<string, string>;
}

interface ClassOption {
  code: string;
  labelPt: string;
  groupLabel: string;
}

/** Editar metadados do investimento — trava até "Editar" (mesmo padrão de `CardEditForm`).
 * Os campos específicos da classe mudam conforme a classe escolhida no modo de edição,
 * então a lista de campos vem de `classCode` no estado (não de `investment.classCode`
 * direto), pra o formulário reagir a uma troca de classe sem sair da tela. */
export function InvestmentEditForm({ investment, classes }: { investment: InvestmentEditFormData; classes: ClassOption[] }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classCode, setClassCode] = useState(investment.classCode);
  const formRef = useRef<HTMLFormElement>(null);

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateInvestmentAction(new FormData(formRef.current!));
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    formRef.current?.reset();
    setClassCode(investment.classCode);
    setEditing(false);
    setError(null);
  }

  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Editar investimento</h2>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className={BTN_GHOST}>
            Editar
          </button>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={investment.id} />

        {error && <p className="text-xs text-red-400 sm:col-span-2">{error}</p>}

        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Nome *
          <input
            name="name"
            defaultValue={investment.name}
            required
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Classe *
          <select
            name="classCode"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            required
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
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
            list="instrument-suggestions-edit"
            defaultValue={investment.details.instrumentType ?? ""}
            disabled={!editing}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
          />
          <datalist id="instrument-suggestions-edit">
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
              defaultValue={investment.details[field.name] ?? ""}
              placeholder={field.placeholder}
              disabled={!editing}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100 disabled:opacity-60"
            />
          </label>
        ))}

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
