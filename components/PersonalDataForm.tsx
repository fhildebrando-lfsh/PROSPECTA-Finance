"use client";

import { useRef, useState } from "react";
import { formatCPF } from "@/lib/validation/cpf";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { useSavedToast } from "@/components/ui/SavedToast";

export interface PersonalDataValues {
  fullName: string;
  phone: string;
  cpf: string;
  birthDate: string;
  addressCep: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
}

const INPUT_CLASS = "rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-amber-500";

/**
 * Formulário de dados pessoais reaproveitado em `/minha-conta` (a própria
 * pessoa) e `/admin/usuarios/:id` (admin em nome de qualquer um) — recebe a
 * Server Action certa por fora, o resto é idêntico. Segue o mesmo padrão
 * das outras telas de Cadastros: estado controlado, `save()` manual
 * chamando a action direto (sem `<form action>`), `useSavedToast()`.
 */
export function PersonalDataForm({
  initialValues,
  action,
  extraFields,
}: {
  initialValues: PersonalDataValues;
  action: (formData: FormData) => Promise<void>;
  extraFields?: Record<string, string>;
}) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast, notify } = useSavedToast();
  const streetRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof PersonalDataValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setValues((v) => ({
          ...v,
          addressStreet: data.logradouro || v.addressStreet,
          addressNeighborhood: data.bairro || v.addressNeighborhood,
          addressCity: data.localidade || v.addressCity,
          addressState: data.uf || v.addressState,
        }));
        streetRef.current?.focus();
      }
    } catch {
      // Busca de CEP é conveniência, não bloqueia o preenchimento manual se falhar.
    } finally {
      setCepLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(values)) fd.set(key, value);
      if (extraFields) for (const [key, value] of Object.entries(extraFields)) fd.set(key, value);
      await action(fd);
      notify();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {toast}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Nome completo
          <input value={values.fullName} onChange={(e) => set("fullName", e.target.value)} className={INPUT_CLASS} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Telefone/WhatsApp
          <input
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(11) 91234-5678"
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          CPF
          <input
            value={values.cpf}
            onChange={(e) => set("cpf", formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Data de nascimento
          <input type="date" value={values.birthDate} onChange={(e) => set("birthDate", e.target.value)} className={INPUT_CLASS} />
        </label>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium text-zinc-400">Endereço</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            CEP
            <input
              value={values.addressCep}
              onChange={(e) => set("addressCep", e.target.value)}
              onBlur={(e) => lookupCep(e.target.value)}
              placeholder="00000-000"
              className={INPUT_CLASS}
            />
            {cepLoading && <span className="text-[10px] text-zinc-500">buscando endereço…</span>}
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400 sm:col-span-2">
            Logradouro
            <input
              ref={streetRef}
              value={values.addressStreet}
              onChange={(e) => set("addressStreet", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Número
            <input value={values.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Complemento
            <input
              value={values.addressComplement}
              onChange={(e) => set("addressComplement", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Bairro
            <input
              value={values.addressNeighborhood}
              onChange={(e) => set("addressNeighborhood", e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Cidade
            <input value={values.addressCity} onChange={(e) => set("addressCity", e.target.value)} className={INPUT_CLASS} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            UF
            <input
              value={values.addressState}
              onChange={(e) => set("addressState", e.target.value.toUpperCase())}
              maxLength={2}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="button" onClick={save} disabled={saving} className={`${BTN_PRIMARY} self-start disabled:opacity-60`}>
        {saving ? "Salvando…" : "Salvar dados pessoais"}
      </button>
    </div>
  );
}
