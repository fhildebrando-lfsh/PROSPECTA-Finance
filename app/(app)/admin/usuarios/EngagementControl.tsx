"use client";

import { useState } from "react";
import { openConsultingEngagement, closeConsultingEngagement } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

// Formatação local — não importa @/lib/format (importa Decimal de
// @/lib/finance/types, que não pode ir pro bundle de Client Component,
// gotcha já documentado, ver PlanGrantControl.tsx).
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

const MODALIDADE_LABELS: Record<string, string> = {
  DIAGNOSTICO: "Diagnóstico",
  PLANEJAMENTO: "Planejamento",
  PROJETO: "Projeto",
  ACOMPANHAMENTO: "Acompanhamento",
};

export interface ActiveEngagementSummary {
  modality: string;
  projectPhase: number | null;
  startsAt: string; // ISO
}

/**
 * Etapa 8 (§4.6, camada 3) — abre e encerra o **contrato de consultoria**.
 *
 * Esta tela faltava: as Server Actions existiam desde a Etapa 8, mas nada as
 * chamava, então a camada de método inteira (`/metodo/*`) era inalcançável na
 * prática — nenhum workspace tinha como ter um contrato. Descoberto ao
 * responder "como eu crio uma consultoria?" (2026-08-17).
 *
 * **Não confundir com atribuir consultor**, logo acima nesta mesma célula.
 * Atribuir consultor dá **acesso** ao workspace; o contrato é o que registra
 * que um profissional assumiu **responsabilidade metodológica** — e é só ele
 * que destrava as features de `gateKind = METODO`. Um cliente pode ter
 * consultor com acesso e nenhum contrato aberto, que é a situação de todos os
 * workspaces hoje.
 */
export function EngagementControl({
  workspaceId,
  workspaceLabel,
  active,
}: {
  workspaceId: string;
  workspaceLabel: string;
  active: ActiveEngagementSummary | null;
}) {
  const [open, setOpen] = useState(false);
  const [modality, setModality] = useState("");

  return (
    <span className="flex flex-col items-start gap-1">
      {active ? (
        <span className="text-xs text-emerald-400">
          Consultoria: {MODALIDADE_LABELS[active.modality] ?? active.modality}
          {active.projectPhase !== null && <> (Fase {active.projectPhase})</>} desde{" "}
          {dateFormatter.format(new Date(active.startsAt))}
          <form
            action={closeConsultingEngagement}
            className="ml-1.5 inline"
            onSubmit={(e) => {
              if (!confirm(`Encerrar a consultoria de "${workspaceLabel}"?\n\nO menu Método deixa de abrir para este cliente. O que já foi produzido continua gravado.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <button type="submit" className="text-zinc-500 hover:text-red-400">
              encerrar
            </button>
          </form>
        </span>
      ) : (
        <span className="text-xs text-zinc-600">Sem contrato de consultoria</span>
      )}

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="text-xs text-indigo-300 hover:text-white">
          {active ? "+ trocar contrato" : "+ abrir consultoria"}
        </button>
      ) : (
        <form
          action={openConsultingEngagement}
          onSubmit={(e) => {
            // A ação encerra o contrato ativo antes de abrir o novo — regra de
            // "nunca dois ativos". Quem clica precisa saber disso antes.
            if (active && !confirm("Já existe uma consultoria ativa. Abrir outra encerra a atual. Continuar?")) {
              e.preventDefault();
              return;
            }
            setOpen(false);
          }}
          className="flex flex-col items-start gap-1"
        >
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <select
            name="modality"
            required
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
          >
            <option value="" disabled>
              — modalidade —
            </option>
            {Object.entries(MODALIDADE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Só Projeto pede fase: ele cobre **uma** fase do método, não a
              trilha inteira, e sem esse número o gate não sabe o que liberar. */}
          {modality === "PROJETO" && (
            <input
              name="projectPhase"
              type="number"
              min="0"
              max="9"
              required
              placeholder="fase contratada (0 a 9)"
              className="w-44 rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100"
            />
          )}

          <div className="flex gap-1">
            <button type="submit" className={`${BTN_SECONDARY} px-2 py-0.5 text-xs`}>
              Abrir
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setModality("");
              }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              cancelar
            </button>
          </div>
        </form>
      )}
    </span>
  );
}
