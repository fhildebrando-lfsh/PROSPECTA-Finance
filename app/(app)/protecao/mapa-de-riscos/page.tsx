import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL } from "@/lib/format";
import { runAssessment } from "@/lib/method/mcrf/run-assessment";
import { buildRiskMap, summarizeRiskMap, type PolicyCoverage } from "@/lib/method/mcrf/risk-map";
import { GateAviso } from "@/components/method/GateAviso";

const TRATAMENTO_LABELS: Record<string, string> = {
  TRANSFERIR: "Transferir",
  COMPLEMENTAR: "Complementar",
  RETER: "Reter",
  COBERTO: "Coberto",
};

const TRATAMENTO_CORES: Record<string, string> = {
  TRANSFERIR: "text-amber-300",
  COMPLEMENTAR: "text-amber-200",
  RETER: "text-indigo-300",
  COBERTO: "text-emerald-400",
};

/**
 * Etapa 12 (§4/§40) — Mapa de Riscos e Proteção: **coberturas atuais ×
 * necessárias**.
 *
 * A necessidade de cada risco **não** vem de uma regra de mercado ("faça um
 * seguro de dez vezes a renda"): vem dos cenários do próprio cliente, medidos
 * em `runAssessment`. É o que mantém o MRP ancorado na vida da pessoa.
 *
 * Gateado por `mrp_completo` — camada de método, decisão comercial de
 * 2026-08-16: reserva e stress tests são Max; diagnóstico de risco é método.
 */
export default async function MapaDeRiscosPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "mrp_completo"))) {
    return (
      <GateAviso
        workspaceId={workspaceId}
        titulo="O Mapa de Riscos e Proteção faz parte da consultoria."
        explicacao="Ele compara, risco a risco, quanto você precisaria ter e quanto seus seguros de fato pagariam — e diz o que fazer com a diferença."
      />
    );
  }

  const [a, policies] = await Promise.all([
    runAssessment(workspaceId),
    prisma.insurancePolicy.findMany({
      where: { workspaceId, isActive: true },
      include: { coverages: true },
    }),
  ]);

  const coberturas: PolicyCoverage[] = policies.flatMap((p) =>
    p.coverages.map((c) => ({
      policyKind: p.kind,
      policyName: p.name,
      riskCovered: c.riskCovered,
      capitalInsured: c.capitalInsured,
      deductible: c.deductible,
      waitingPeriodDays: c.waitingPeriodDays,
      payoutDelayDays: c.payoutDelayDays,
    })),
  );

  const rows = buildRiskMap(a.scenarios, coberturas);
  const resumo = summarizeRiskMap(rows);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-4 text-sm text-amber-200">
        Ainda não há dado suficiente para simular seus cenários — sem eles não há como dizer de quanta proteção você
        precisa. Registre alguns meses de lançamentos e preencha o Perfil de Risco.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Para cada risco que pesa na sua vida, este mapa mostra <strong className="text-zinc-400">quanto você
        precisaria ter</strong>, <strong className="text-zinc-400">quanto seus seguros pagariam de fato</strong> — já
        descontando franquia e carência — e o que sobra para você. A necessidade não vem de uma regra de mercado: vem
        dos seus próprios cenários, os mesmos que calculam sua{" "}
        <Link href="/protecao/reserva" className="text-indigo-300 hover:text-indigo-200">
          Reserva de Emergência
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card label="Necessidade somada" value={formatCurrencyBRL(resumo.totalNecessario)} hint="todos os riscos materiais" />
        <Card label="Coberto por seguro" value={formatCurrencyBRL(resumo.totalCoberto)} hint="já com franquia e carência" />
        <Card label="Exposição residual" value={formatCurrencyBRL(resumo.totalResidual)} hint="o que sobra para você" />
      </div>

      <p className="text-[11px] text-zinc-600">
        Os totais somam riscos que não acontecem todos juntos — servem para dimensionar a conversa, não como um valor
        a ser guardado. Quem diz quanto guardar é a Reserva.
      </p>

      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-3 py-2 text-left font-medium">Risco</th>
              <th className="px-3 py-2 text-right font-medium">Necessário</th>
              <th className="px-3 py-2 text-right font-medium">Seguro paga</th>
              <th className="px-3 py-2 text-right font-medium">Sobra para você</th>
              <th className="px-3 py-2 text-left font-medium">Tratamento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.scenarioId} className="border-b border-zinc-800/60 align-top">
                <td className="px-3 py-2 text-zinc-200">
                  {r.label}
                  {r.apolicesAplicaveis.length > 0 && (
                    <span className="mt-0.5 block text-[11px] text-zinc-600">
                      considerando: {r.apolicesAplicaveis.join(", ")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-300">
                  {formatCurrencyBRL(r.necessario)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-emerald-400">
                  {formatCurrencyBRL(r.cobertoPorSeguro)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">
                  {formatCurrencyBRL(r.residual)}
                </td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-medium ${TRATAMENTO_CORES[r.tratamento]}`}>
                    {TRATAMENTO_LABELS[r.tratamento]}
                  </span>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{r.justificativa}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resumo.aTransferir.length > 0 && (
        <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="text-sm font-medium text-zinc-200">O que dá para transferir</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Existe seguro no mercado para estes riscos e você não tem cobertura aplicável hoje. Transferir custa
            prêmio, mas libera a liquidez que hoje precisa ficar parada por causa deles.
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
            {resumo.aTransferir.map((r) => (
              <li key={r.scenarioId}>
                {r.label} — exposição de {formatCurrencyBRL(r.residual)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {resumo.aReter.length > 0 && (
        <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="text-sm font-medium text-zinc-200">O que só a liquidez resolve</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Nenhum seguro transfere estes riscos. É por causa deles que a reserva existe — e é essa a resposta certa
            aqui, não uma apólice.
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
            {resumo.aReter.map((r) => (
              <li key={r.scenarioId}>
                {r.label} — {formatCurrencyBRL(r.residual)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="max-w-3xl text-xs text-zinc-600">
        O mapa diagnostica exposição; ele não indica seguradora nem produto. Que apólice contratar é conversa sua com
        um profissional licenciado — a PROSPECTA registra o que você já tem em{" "}
        <Link href="/protecao/seguros" className="text-indigo-300 hover:text-indigo-200">
          Proteção e Segurança → Seguros
        </Link>
        .
      </p>
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
