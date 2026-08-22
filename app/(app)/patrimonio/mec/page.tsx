import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { orientacoes, rankByCost, summarize, MODALIDADES_TOXICAS } from "@/lib/method/mec";
import { GateAviso } from "@/components/method/GateAviso";
import { BTN_PRIMARY, BTN_DANGER } from "@/components/ui/buttonStyles";
import { salvarDivida, excluirDivida } from "./actions";

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

const STATUS_LABELS: Record<string, string> = {
  EM_DIA: "Em dia",
  NEGATIVADO: "Negativado",
  RENEGOCIADO: "Renegociado",
  QUITADO: "Quitado",
};

/** Lista de partida; o campo é livre, então dá para digitar outra. */
const MODALIDADES = [
  ...MODALIDADES_TOXICAS,
  "Empréstimo pessoal",
  "Consignado",
  "Financiamento de veículo",
  "Financiamento imobiliário",
  "Crédito estudantil",
  "Parcelamento de fatura",
  "Dívida com pessoa física",
  "Dívida tributária",
  "Outra",
];

/**
 * Etapa 11 (§10, Fase 3) — Mapa de Endividamento e Crédito.
 *
 * **Não substitui Patrimônio → Dívidas**, que continua lendo os parcelamentos
 * de `Entry` e responde "quanto falta pagar". Esta tela responde outra
 * pergunta: **quanto custa, para quem devo, e em que ordem sair**. Cheque
 * especial e rotativo, as duas modalidades mais caras, normalmente nem existem
 * como parcelamento — escapariam de qualquer análise baseada só em lançamento.
 */
export default async function MecPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "mec_completo"))) {
    return (
      <GateAviso
        workspaceId={workspaceId}
        titulo="O Mapa de Endividamento e Crédito faz parte da consultoria."
        explicacao="Ele organiza suas dívidas por custo — credor, CET, negativação — e indica por onde sair. Em Patrimônio → Dívidas você continua acompanhando o que já está parcelado."
      />
    );
  }

  const rows = await prisma.debt.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });

  const ranked = rankByCost(
    rows.map((d) => ({
      id: d.id,
      creditorName: d.creditorName,
      modality: d.modality,
      outstandingBalance: d.outstandingBalance,
      cetAnnualPercent: d.cetAnnualPercent,
      hasNegativacao: d.hasNegativacao,
      hasLegalAction: d.hasLegalAction,
      status: d.status,
    })),
  );
  const resumo = summarize(ranked);
  const quitadas = rows.filter((d) => d.status === "QUITADO");
  const porId = new Map(rows.map((d) => [d.id, d]));

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Este mapa ordena suas dívidas por <strong className="text-zinc-400">custo</strong>, não por tamanho — cada
        real amortizado na mais cara rende mais que na maior. Em{" "}
        <Link href="/patrimonio/dividas" className="text-indigo-300 hover:text-indigo-200">
          Patrimônio → Dívidas
        </Link>{" "}
        você continua vendo o que já está lançado como parcela.
      </p>

      {ranked.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              label="Total em aberto"
              value={formatCurrencyBRL(resumo.totalEmAberto)}
              hint={`${resumo.quantidade} dívida(s)`}
            />
            <Card
              label="Em modalidade cara"
              value={formatCurrencyBRL(resumo.totalToxico)}
              hint={resumo.quantidadeToxica > 0 ? `${resumo.quantidadeToxica} dívida(s)` : "nenhuma"}
            />
            <Card label="Negativação" value={resumo.temNegativacao ? "Sim" : "Não"} hint="restrição no nome" />
            <Card label="Sem custo informado" value={String(resumo.semCet)} hint="impede ordenar direito" />
          </div>

          <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <h2 className="text-sm font-medium text-zinc-200">Por onde sair</h2>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
              {orientacoes(ranked, resumo).map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-zinc-600">
              O mapa diagnostica e ordena; ele não indica produto nem credor. Renegociação é decisão sua com quem
              você deve.
            </p>
          </section>

          <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Credor</th>
                  <th className="px-3 py-2 text-left font-medium">Modalidade</th>
                  <th className="px-3 py-2 text-right font-medium">Saldo</th>
                  <th className="px-3 py-2 text-right font-medium">CET a.a.</th>
                  <th className="px-3 py-2 text-left font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((d) => (
                  <tr key={d.id} className="border-b border-zinc-800/60 align-top">
                    <td className="px-3 py-2 font-mono tabular-nums text-zinc-500">{d.ordem}</td>
                    <td className="px-3 py-2 text-zinc-200">
                      {d.creditorName}
                      {d.toxic.isToxic && (
                        <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-[11px] text-amber-300">
                          {d.toxic.motivos.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">{d.modality}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">
                      {formatCurrencyBRL(d.outstandingBalance)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-400">
                      {d.cetAnnualPercent ? `${d.cetAnnualPercent.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className={d.status === "NEGATIVADO" ? "text-amber-300" : "text-zinc-400"}>
                        {STATUS_LABELS[d.status]}
                      </span>
                      {d.hasLegalAction && <span className="block text-red-300">ação judicial</span>}
                      {porId.get(d.id)?.quitationTargetDate && (
                        <span className="block text-zinc-600">
                          meta: {formatDateBR(porId.get(d.id)!.quitationTargetDate!)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <details className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <summary className="cursor-pointer text-sm font-medium text-zinc-200">
          {ranked.length === 0 ? "Registrar a primeira dívida" : "Registrar outra dívida"}
        </summary>
        <FormularioDivida />
      </details>

      {rows.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Editar registros</h2>
          <div className="flex flex-col gap-4">
            {rows.map((d) => (
              <details key={d.id} className="rounded-lg border border-zinc-800 p-3">
                <summary className="cursor-pointer text-sm text-zinc-300">
                  {d.creditorName} — {d.modality} ({formatCurrencyBRL(d.outstandingBalance)})
                  {d.status === "QUITADO" && <span className="ml-2 text-xs text-emerald-400">quitada</span>}
                </summary>
                <FormularioDivida divida={d} />
              </details>
            ))}
          </div>
          {quitadas.length > 0 && (
            <p className="mt-3 text-[11px] text-zinc-600">
              {quitadas.length} dívida(s) quitada(s) saem do mapa, mas continuam aqui — o histórico do que já foi
              pago é parte do trabalho.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <p className="text-xs text-indigo-300">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-zinc-100">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}

type DebtRow = Awaited<ReturnType<typeof prisma.debt.findMany>>[number];

function FormularioDivida({ divida }: { divida?: DebtRow }) {
  return (
    <form action={salvarDivida} className="mt-3 flex flex-col gap-3">
      {divida && <input type="hidden" name="id" value={divida.id} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className={LABEL}>
          Credor
          <input name="creditorName" required defaultValue={divida?.creditorName ?? ""} className={INPUT} />
        </label>
        <label className={LABEL}>
          Modalidade
          <input
            name="modality"
            required
            list="modalidades-mec"
            defaultValue={divida?.modality ?? ""}
            className={INPUT}
          />
          <datalist id="modalidades-mec">
            {MODALIDADES.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </label>
        <label className={LABEL}>
          Saldo devedor (R$)
          <input
            name="outstandingBalance"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={divida ? divida.outstandingBalance.toFixed(2) : ""}
            className={INPUT}
          />
        </label>
        <label className={LABEL}>
          CET ao ano (%)
          <input
            name="cetAnnualPercent"
            type="number"
            step="0.01"
            min="0"
            defaultValue={divida?.cetAnnualPercent ? divida.cetAnnualPercent.toFixed(2) : ""}
            className={INPUT}
          />
          <span className="text-[11px] text-zinc-600">
            Está no contrato ou na fatura. Sem ele o mapa não sabe qual sai primeiro.
          </span>
        </label>
        <label className={LABEL}>
          Situação
          <select name="status" defaultValue={divida?.status ?? "EM_DIA"} className={INPUT}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Meta de quitação
          <input
            name="quitationTargetDate"
            type="date"
            defaultValue={divida?.quitationTargetDate ? divida.quitationTargetDate.toISOString().slice(0, 10) : ""}
            className={INPUT}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            name="hasNegativacao"
            defaultChecked={divida?.hasNegativacao}
            className="accent-amber-500"
          />
          Nome negativado por esta dívida
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400">
          <input
            type="checkbox"
            name="hasLegalAction"
            defaultChecked={divida?.hasLegalAction}
            className="accent-amber-500"
          />
          Há ação judicial
        </label>
      </div>

      <label className={LABEL}>
        Observações
        <textarea name="notes" rows={2} defaultValue={divida?.notes ?? ""} className={INPUT} />
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" className={BTN_PRIMARY}>
          {divida ? "Salvar" : "Registrar"}
        </button>
      </div>

      {divida && (
        <div className="border-t border-zinc-800 pt-3">
          <button formAction={excluirDivida} className={BTN_DANGER}>
            Excluir registro
          </button>
          <p className="mt-1 text-[11px] text-zinc-600">
            Para uma dívida paga, prefira marcar como <strong>quitada</strong> — excluir apaga o histórico.
          </p>
        </div>
      )}
    </form>
  );
}
