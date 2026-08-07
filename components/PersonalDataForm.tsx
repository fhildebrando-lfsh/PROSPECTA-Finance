"use client";

import { useRef, useState } from "react";
import { formatCPF } from "@/lib/validation/cpf";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { LgpdSavedModal } from "@/components/ui/LgpdSavedModal";

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

const INPUT_CLASS =
  "rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-amber-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-500";

/**
 * Formulário de dados pessoais reaproveitado em `/minha-conta` (a própria
 * pessoa) e `/admin/usuarios/:id` (admin em nome de qualquer um) — recebe a
 * Server Action certa por fora, o resto é idêntico. Campos ficam travados
 * (`disabled`) por padrão — só liberam depois de clicar "Editar", pra evitar
 * edição/toque acidental num dado pessoal sensível. Depois de salvar, mostra
 * um aviso de LGPD (`LgpdSavedModal`) em vez do toast pequeno padrão — dado
 * pessoal exige um aviso mais visível que "Salvo".
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const streetRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof PersonalDataValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function startEditing() {
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setValues(initialValues);
    setError(null);
    setEditing(false);
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
      setEditing(false);
      setShowSavedModal(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const disabled = !editing;

  return (
    <div className="flex flex-col gap-4">
      {showSavedModal && <LgpdSavedModal onClose={() => setShowSavedModal(false)} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Nome completo
          <input
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            disabled={disabled}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Telefone/WhatsApp
          <input
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(11) 91234-5678"
            disabled={disabled}
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
            disabled={disabled}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Data de nascimento
          <input
            type="date"
            value={values.birthDate}
            onChange={(e) => set("birthDate", e.target.value)}
            disabled={disabled}
            className={INPUT_CLASS}
          />
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
              disabled={disabled}
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
              disabled={disabled}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Número
            <input
              value={values.addressNumber}
              onChange={(e) => set("addressNumber", e.target.value)}
              disabled={disabled}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Complemento
            <input
              value={values.addressComplement}
              onChange={(e) => set("addressComplement", e.target.value)}
              disabled={disabled}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Bairro
            <input
              value={values.addressNeighborhood}
              onChange={(e) => set("addressNeighborhood", e.target.value)}
              disabled={disabled}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Cidade
            <input
              value={values.addressCity}
              onChange={(e) => set("addressCity", e.target.value)}
              disabled={disabled}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            UF
            <input
              value={values.addressState}
              onChange={(e) => set("addressState", e.target.value.toUpperCase())}
              maxLength={2}
              disabled={disabled}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        {!editing && (
          <button type="button" onClick={startEditing} className={`${BTN_PRIMARY} self-start`}>
            Editar
          </button>
        )}
        {editing && (
          <>
            <button type="button" onClick={save} disabled={saving} className={`${BTN_PRIMARY} self-start disabled:opacity-60`}>
              {saving ? "Salvando…" : "Salvar dados pessoais"}
            </button>
            <button type="button" onClick={cancelEditing} disabled={saving} className={`${BTN_SECONDARY} self-start`}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
