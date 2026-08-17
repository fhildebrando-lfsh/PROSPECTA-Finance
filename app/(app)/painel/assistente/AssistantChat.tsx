"use client";

import { useActionState, useState, useTransition } from "react";
import { askAssistant, limparHistoricoAssistente, type AskAssistantState } from "./actions";
import { BTN_GHOST, BTN_DANGER, BTN_SECONDARY } from "@/components/ui/buttonStyles";

export interface InteractionSummary {
  id: string;
  question: string;
  answerText: string;
}

const initialState: AskAssistantState = { question: null, answerText: null, error: null };

const SUGGESTIONS = [
  "Qual meu saldo?",
  "Quanto eu gastei este mês?",
  "Quanto falta pra minha reserva?",
  "Quantos incidentes eu tenho?",
];

/**
 * Apagar histórico é irreversível, então o botão pede confirmação em vez de
 * agir no primeiro clique — e a confirmação diz o que vai acontecer, não só
 * "tem certeza?".
 */
function LimparHistorico() {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, start] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (!confirmando) {
    return (
      <button type="button" onClick={() => setConfirmando(true)} className={BTN_GHOST}>
        Limpar histórico
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Apagar todas as perguntas deste workspace?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setErro(null);
              try {
                await limparHistoricoAssistente();
                setConfirmando(false);
              } catch (e) {
                setErro(e instanceof Error ? e.message : "Não foi possível apagar.");
              }
            })
          }
          className={`${BTN_DANGER} disabled:opacity-40`}
        >
          {pending ? "Apagando…" : "Apagar"}
        </button>
        <button type="button" onClick={() => setConfirmando(false)} className={BTN_GHOST}>
          Cancelar
        </button>
      </div>
      {erro && <p className="text-xs text-red-300">{erro}</p>}
    </div>
  );
}

/**
 * Q&A determinístico (lib/method/ai-assistant.ts) — nunca um modelo de
 * linguagem livre. Cada resposta usa só as funções puras de lib/finance/,
 * nunca "calcula" um valor por conta própria (§3.1/P2 da Metodologia).
 */
export function AssistantChat({ history }: { history: InteractionSummary[] }) {
  const [state, action, pending] = useActionState(askAssistant, initialState);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <span key={s} className="rounded-full border border-indigo-900/60 px-2.5 py-1 text-xs text-indigo-300">
            {s}
          </span>
        ))}
      </div>

      <form action={action} className="flex gap-2">
        <input
          name="question"
          required
          placeholder="Pergunte algo sobre suas finanças…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
        />
        <button type="submit" disabled={pending} className={`${BTN_SECONDARY} disabled:opacity-40`}>
          {pending ? "Perguntando…" : "Perguntar"}
        </button>
      </form>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.answerText && (
        <div className="rounded-lg border border-indigo-900/50 bg-[#131A47] p-3 text-sm">
          <p className="text-zinc-500">{state.question}</p>
          <p className="mt-1 text-zinc-100">{state.answerText}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-zinc-300">Histórico</h2>
            <LimparHistorico />
          </div>
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm">
                <p className="text-zinc-500">{h.question}</p>
                <p className="mt-1 text-zinc-300">{h.answerText}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
