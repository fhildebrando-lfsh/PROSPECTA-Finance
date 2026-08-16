"use client";

import { useState } from "react";
import { createAutomationRule, toggleAutomationRule, deleteAutomationRule } from "./actions";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

export interface RuleSummary {
  id: string;
  trigger: string;
  isActive: boolean;
  /** Descrição já formatada no servidor (Server Component) — evita importar Decimal aqui, mesmo gotcha de WalletReconcileControl.tsx. */
  description: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  LIMIAR_CATEGORIA: "Gasto de categoria passou de um valor",
  VENCIMENTO_PROXIMO: "Compromisso vencendo em breve",
  VARIACAO_RECORRENCIA: "Valor de uma recorrência mudou",
  META_FORA_DA_TRAJETORIA: "Meta fora da trajetória esperada",
  INCIDENTE_ACUMULADO: "Fila de incidentes acumulou",
};

const INPUT_CLASS = "rounded border border-zinc-700 bg-zinc-950 px-1.5 py-0.5 text-xs text-zinc-100";

/**
 * ARQUITETURA-METODO-PROSPECTAR.md §5.5, Etapa 6 — catálogo fixo de 5
 * "templates" de alerta (não um construtor de regra livre), avaliados 1x/dia
 * pelo cron (`app/api/cron/automations/route.ts`). Automação aqui é sempre
 * alerta — nunca cria, edita ou liquida nada sozinha.
 */
export function AutomationRulesPanel({
  rules,
  despesaCategories,
}: {
  rules: RuleSummary[];
  despesaCategories: CategoryOption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {rules.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-indigo-900/50 bg-[#131A47] px-3 py-2 text-sm"
            >
              <div className="flex flex-col">
                <span className={rule.isActive ? "text-zinc-100" : "text-zinc-500 line-through"}>
                  {rule.description}
                </span>
                <span className="text-xs text-zinc-500">{TRIGGER_LABELS[rule.trigger] ?? rule.trigger}</span>
              </div>
              <div className="flex shrink-0 gap-2 text-xs">
                <form action={toggleAutomationRule}>
                  <input type="hidden" name="id" value={rule.id} />
                  <input type="hidden" name="isActive" value={String(rule.isActive)} />
                  <button type="submit" className="text-indigo-300 hover:text-white">
                    {rule.isActive ? "pausar" : "reativar"}
                  </button>
                </form>
                <form
                  action={deleteAutomationRule}
                  onSubmit={(e) => {
                    if (!confirm("Excluir este alerta?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={rule.id} />
                  <button type="submit" className="text-zinc-500 hover:text-red-400">
                    excluir
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <NewLimiarCategoriaForm categories={despesaCategories} />
        <NewVencimentoProximoForm />
        <NewVariacaoRecorrenciaForm />
        <NewMetaForaDaTrajetoriaForm />
        <NewIncidenteAcumuladoForm />
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <form
      action={createAutomationRule}
      className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
    >
      <p className="text-xs font-medium text-zinc-300">{title}</p>
      {children}
    </form>
  );
}

function NewLimiarCategoriaForm({ categories }: { categories: CategoryOption[] }) {
  const [open, setOpen] = useState(false);
  if (!open) return <AddButton label="+ avisar por categoria" onClick={() => setOpen(true)} />;
  return (
    <Card title="Avisar quando eu gastar mais de um valor numa categoria">
      <input type="hidden" name="trigger" value="LIMIAR_CATEGORIA" />
      <select name="categoryId" required defaultValue="" className={INPUT_CLASS}>
        <option value="" disabled>
          — categoria —
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <input name="thresholdAmount" type="number" step="0.01" min="0.01" required placeholder="valor limite (R$)" className={INPUT_CLASS} />
      <SubmitRow onCancel={() => setOpen(false)} />
    </Card>
  );
}

function NewVencimentoProximoForm() {
  const [open, setOpen] = useState(false);
  if (!open) return <AddButton label="+ avisar de vencimento" onClick={() => setOpen(true)} />;
  return (
    <Card title="Avisar quando um compromisso estiver vencendo">
      <input type="hidden" name="trigger" value="VENCIMENTO_PROXIMO" />
      <input name="daysBefore" type="number" min="1" step="1" required placeholder="dias de antecedência" className={INPUT_CLASS} />
      <SubmitRow onCancel={() => setOpen(false)} />
    </Card>
  );
}

function NewVariacaoRecorrenciaForm() {
  const [open, setOpen] = useState(false);
  if (!open) return <AddButton label="+ avisar de variação de recorrência" onClick={() => setOpen(true)} />;
  return (
    <Card title="Avisar quando uma recorrência mudar de valor">
      <input type="hidden" name="trigger" value="VARIACAO_RECORRENCIA" />
      <input name="percentThreshold" type="number" min="1" step="1" required placeholder="variação mínima (%)" className={INPUT_CLASS} />
      <SubmitRow onCancel={() => setOpen(false)} />
    </Card>
  );
}

function NewMetaForaDaTrajetoriaForm() {
  const [open, setOpen] = useState(false);
  if (!open) return <AddButton label="+ avisar de meta atrasada" onClick={() => setOpen(true)} />;
  return (
    <Card title="Avisar quando uma meta estiver abaixo do ritmo esperado">
      <input type="hidden" name="trigger" value="META_FORA_DA_TRAJETORIA" />
      <p className="text-xs text-zinc-500">Avalia todas as suas metas ativas com data-alvo, sem parâmetro adicional.</p>
      <SubmitRow onCancel={() => setOpen(false)} />
    </Card>
  );
}

function NewIncidenteAcumuladoForm() {
  const [open, setOpen] = useState(false);
  if (!open) return <AddButton label="+ avisar de fila de incidentes" onClick={() => setOpen(true)} />;
  return (
    <Card title="Avisar quando a fila de incidentes acumular">
      <input type="hidden" name="trigger" value="INCIDENTE_ACUMULADO" />
      <input name="thresholdCount" type="number" min="1" step="1" required placeholder="a partir de quantos incidentes" className={INPUT_CLASS} />
      <SubmitRow onCancel={() => setOpen(false)} />
    </Card>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-dashed border-zinc-700 p-3 text-left text-xs text-indigo-300 hover:border-indigo-600 hover:text-white"
    >
      {label}
    </button>
  );
}

function SubmitRow({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-2">
      <button type="submit" className={`${BTN_SECONDARY} px-2 py-0.5 text-xs`}>
        Ativar
      </button>
      <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">
        cancelar
      </button>
    </div>
  );
}
