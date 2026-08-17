"use client";

import { useState } from "react";
import { iniciarFase, registrarGate } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

export function IniciarFaseForm({ proximaFase }: { proximaFase: number }) {
  return (
    <form action={iniciarFase} className="flex flex-wrap items-end gap-2">
      <label className={LABEL}>
        Abrir fase
        <input
          name="phaseNumber"
          type="number"
          min={0}
          max={9}
          defaultValue={proximaFase}
          required
          className={`${INPUT} w-24`}
        />
      </label>
      <button type="submit" className={`${BTN_SECONDARY} px-3 py-1.5 text-xs`}>
        Abrir
      </button>
      <span className="text-[11px] text-zinc-600">Fases 0 a 8; 9 é a Fase ∞ (Plano Integrado).</span>
    </form>
  );
}

/**
 * §7.3 — o ritual de passagem. Avanço condicional e retorno assistido só são
 * aceitos com prazo de micrometa; o formulário mostra o campo e o servidor
 * também barra, porque avançar com ressalva sem prazo é avançar sem ressalva.
 */
export function GateForm({ phaseId, phaseNumber }: { phaseId: string; phaseNumber: number }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("");

  const exigeMicrometa = result === "AVANCO_CONDICIONAL" || result === "RETORNO_ASSISTIDO";

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-indigo-300 hover:text-white">
        + registrar passagem da Fase {phaseNumber}
      </button>
    );
  }

  return (
    <form
      action={registrarGate}
      onSubmit={() => setOpen(false)}
      className="mt-2 flex flex-col gap-2 rounded-lg border border-zinc-800 p-3"
    >
      <input type="hidden" name="phaseId" value={phaseId} />
      <label className={LABEL}>
        Critério avaliado
        <input name="criterion" required placeholder="ex.: cliente sustentou 3 meses de registro completo" className={INPUT} />
      </label>
      <label className={LABEL}>
        Resultado
        <select
          name="result"
          required
          defaultValue=""
          onChange={(e) => setResult(e.target.value)}
          className={INPUT}
        >
          <option value="" disabled>
            — escolha —
          </option>
          <option value="AVANCO_PLENO">Avanço pleno</option>
          <option value="AVANCO_CONDICIONAL">Avanço condicional</option>
          <option value="RETORNO_ASSISTIDO">Retorno assistido</option>
        </select>
      </label>
      <label className={LABEL}>
        Evidência
        <input name="evidence" placeholder="opcional — o que sustentou a decisão" className={INPUT} />
      </label>
      {exigeMicrometa && (
        <label className={LABEL}>
          Prazo da micrometa (obrigatório neste resultado)
          <input name="followUpDueAt" type="date" required className={INPUT} />
        </label>
      )}
      <div className="flex gap-2">
        <button type="submit" className={`${BTN_SECONDARY} px-2 py-1 text-xs`}>
          Registrar
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
          cancelar
        </button>
      </div>
    </form>
  );
}
