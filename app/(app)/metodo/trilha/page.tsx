import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { formatDateBR } from "@/lib/format";
import { GateForm, IniciarFaseForm } from "./GateForm";

const FASES: Record<number, string> = {
  0: "Fase 0 — Diagnóstico e contexto",
  1: "Fase 1 — Organização e consciência",
  2: "Fase 2 — Estabilização",
  3: "Fase 3 — Endividamento e crédito",
  4: "Fase 4 — Proteção e riscos",
  5: "Fase 5 — Construção patrimonial",
  6: "Fase 6 — Longevidade",
  7: "Fase 7 — Continuidade patrimonial",
  8: "Fase 8 — Consolidação",
  9: "Fase ∞ — Plano Integrado",
};

const RESULTADO_LABELS: Record<string, string> = {
  EM_ANDAMENTO: "Em andamento",
  AVANCO_PLENO: "Avanço pleno",
  AVANCO_CONDICIONAL: "Avanço condicional",
  RETORNO_ASSISTIDO: "Retorno assistido",
};

const RESULTADO_CORES: Record<string, string> = {
  EM_ANDAMENTO: "text-indigo-300",
  AVANCO_PLENO: "text-emerald-400",
  AVANCO_CONDICIONAL: "text-amber-300",
  RETORNO_ASSISTIDO: "text-amber-400",
};

const MODALIDADE_LABELS: Record<string, string> = {
  DIAGNOSTICO: "Diagnóstico",
  PLANEJAMENTO: "Planejamento",
  PROJETO: "Projeto",
  ACOMPANHAMENTO: "Acompanhamento",
};

/**
 * Etapa 8 (§7) — a trilha do método e o ritual de passagem.
 *
 * Gateada por `metodo_trilha`, que é feature de `gateKind = METODO`: ela só
 * abre com `ConsultingEngagement` ativo. Assinatura, por mais completa que
 * seja, não abre — §3.1 da Metodologia.
 *
 * O cliente **vê** a trilha; só o consultor com escrita (ou o admin da
 * plataforma) registra passagem. Deixar o cliente se auto-aprovar esvaziaria
 * o gate.
 */
export default async function TrilhaPage() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "metodo_trilha"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">A trilha do método existe quando há uma consultoria ativa.</p>
        <p className="mt-2">
          Diferente das demais telas, esta não é liberada por plano: ela acompanha um trabalho conduzido por um
          profissional, com fases e critérios de passagem registrados.
        </p>
      </div>
    );
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) {
    return <p className="text-sm text-indigo-300">Nenhum contrato de consultoria ativo.</p>;
  }

  const phases = await prisma.methodPhase.findMany({
    where: { engagementId: engagement.id },
    include: { gateChecks: { orderBy: { evaluatedAt: "desc" } } },
    orderBy: { phaseNumber: "asc" },
  });

  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  const podeRegistrar =
    (membership?.role === "ADVISOR" && membership.advisorCanWrite) || profile.isPlatformAdmin;

  const emAndamento = phases.filter((p) => p.status === "EM_ANDAMENTO");
  const proximaFase = phases.length === 0 ? 0 : Math.max(...phases.map((p) => p.phaseNumber)) + 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <p className="text-xs text-indigo-300">Consultoria ativa</p>
        <p className="mt-1 text-sm text-zinc-100">
          {MODALIDADE_LABELS[engagement.modality] ?? engagement.modality}
          {engagement.track && <span className="text-zinc-500"> · trilha {engagement.track.toLowerCase()}</span>}
          {engagement.modality === "PROJETO" && engagement.projectPhase !== null && (
            <span className="text-zinc-500"> · escopo restrito à Fase {engagement.projectPhase}</span>
          )}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Desde {formatDateBR(engagement.startsAt)}
          {engagement.endsAt && ` · previsto até ${formatDateBR(engagement.endsAt)}`}
        </p>
      </div>

      <p className="max-w-3xl text-sm text-zinc-500">
        Cada fase termina com um ritual de passagem: um critério avaliado, um resultado e a evidência que o sustentou.
        Avanço condicional e retorno assistido exigem uma micrometa com prazo — avançar com ressalva sem prazo é
        avançar sem ressalva.
      </p>

      {podeRegistrar && proximaFase <= 9 && <IniciarFaseForm proximaFase={proximaFase} />}

      {phases.length === 0 ? (
        <p className="text-sm text-indigo-300">Nenhuma fase aberta ainda.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {phases.map((p) => (
            <li key={p.id} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-zinc-100">{FASES[p.phaseNumber] ?? `Fase ${p.phaseNumber}`}</h2>
                <span className={`text-xs ${RESULTADO_CORES[p.status]}`}>{RESULTADO_LABELS[p.status]}</span>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">
                Iniciada em {formatDateBR(p.startedAt)}
                {p.endedAt && ` · encerrada em ${formatDateBR(p.endedAt)}`}
              </p>

              {p.gateChecks.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {p.gateChecks.map((g) => (
                    <li key={g.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2 text-sm">
                      <p className="text-zinc-200">{g.criterion}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        <span className={RESULTADO_CORES[g.result]}>{RESULTADO_LABELS[g.result]}</span>
                        {" · "}
                        {formatDateBR(g.evaluatedAt)}
                        {g.followUpDueAt && ` · micrometa até ${formatDateBR(g.followUpDueAt)}`}
                      </p>
                      {g.evidence && <p className="mt-1 text-xs text-zinc-600">{g.evidence}</p>}
                    </li>
                  ))}
                </ul>
              )}

              {podeRegistrar && p.status === "EM_ANDAMENTO" && (
                <div className="mt-3">
                  <GateForm phaseId={p.id} phaseNumber={p.phaseNumber} />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {emAndamento.length > 1 && (
        <p className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-3 text-xs text-amber-200">
          Há {emAndamento.length} fases abertas ao mesmo tempo. É permitido (a Fase 3 roda em paralelo com a 2, §9.6),
          mas vale conferir se é intencional.
        </p>
      )}
    </div>
  );
}
