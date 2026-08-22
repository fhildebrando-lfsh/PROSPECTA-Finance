import Link from "next/link";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { formatDateBR } from "@/lib/format";
import { compilePfi, type DeliverableSnapshot } from "@/lib/method/pfi";
import type { DeliverableContent } from "@/lib/method/deliverables/catalog";
import { GateAviso } from "@/components/method/GateAviso";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { compilarPfi } from "./actions";

const FAIXA_LABELS: Record<string, string> = {
  critico: "Crítico",
  fragil: "Frágil",
  em_construcao: "Em construção",
  saudavel: "Saudável",
  consolidado: "Consolidado",
};

/**
 * Etapa 16 (§10, Fase ∞) — o Plano Financeiro Integrado.
 *
 * A tela mostra a **prévia** do que seria compilado, sempre recalculada do dado
 * de hoje, e só grava quando o consultor manda. Prévia que já grava tiraria do
 * consultor a chance de ver o resultado antes de ele virar documento entregue.
 */
export default async function PlanoIntegradoPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "pfi_compilador"))) {
    return (
      <GateAviso
        workspaceId={workspaceId}
        titulo="O Plano Financeiro Integrado faz parte da consultoria."
        explicacao="Ele reúne num documento só tudo que foi produzido no contrato e mostra como a Saúde Financeira evoluiu desde a linha de base — o comparativo início × fim."
      />
    );
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) return <p className="text-sm text-indigo-300">Nenhum contrato de consultoria ativo.</p>;

  const profile = await requireProfile();
  const [todos, snapshots] = await Promise.all([
    prisma.deliverable.findMany({
      where: { engagementId: engagement.id },
      orderBy: [{ code: "asc" }, { version: "desc" }],
    }),
    prisma.healthSnapshot.findMany({ where: { workspaceId }, orderBy: { snapshotDate: "asc" } }),
  ]);

  const maisRecentes = new Map<string, (typeof todos)[number]>();
  for (const d of todos) if (!maisRecentes.has(d.code)) maisRecentes.set(d.code, d);

  const paraSnapshot = (d: (typeof todos)[number]): DeliverableSnapshot => ({
    code: d.code,
    version: d.version,
    status: d.status,
    createdAt: d.createdAt,
    validatedAt: d.validatedAt,
  });

  const pfisAnteriores = todos.filter((d) => d.code === "PFI");
  const pfiAnterior = pfisAnteriores[0] ?? null;

  const previa = compilePfi({
    deliverables: [...maisRecentes.values()].map(paraSnapshot),
    baseSnapshotDate: snapshots[0]?.snapshotDate ?? null,
    baseIndicators: snapshots[0]?.indicators ?? {},
    atualSnapshotDate: snapshots.at(-1)?.snapshotDate ?? null,
    atualIndicators: snapshots.at(-1)?.indicators ?? {},
    pfiAnterior: pfiAnterior
      ? {
          version: pfiAnterior.version,
          deliverables:
            ((pfiAnterior.content as unknown as DeliverableContent & { inventario?: DeliverableSnapshot[] })
              .inventario ?? []),
        }
      : null,
    hoje: new Date(),
  });

  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  const podeProduzir =
    (membership?.role === "ADVISOR" && membership.advisorCanWrite) || profile.isPlatformAdmin;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-zinc-500">
          O plano integrado reúne o que foi produzido neste contrato e mostra como a Saúde Financeira se moveu desde
          a linha de base. Ele <strong className="text-zinc-400">aponta</strong> para cada artefato na versão em que
          ele está, em vez de copiar o texto — cópia envelheceria em silêncio no dia em que o original fosse revisto.
        </p>
        {podeProduzir && (
          <form action={compilarPfi}>
            <button type="submit" className={BTN_PRIMARY}>
              Compilar versão {pfisAnteriores.length === 0 ? "0" : `${pfiAnterior!.version + 1}`}
            </button>
          </form>
        )}
      </div>

      {previa.avisos.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 rounded-xl border border-amber-900/50 bg-amber-950/10 p-4 pl-8 text-sm text-amber-200">
          {previa.avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}

      <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="text-sm font-medium text-zinc-200">Saúde Financeira: linha de base × hoje</h2>
        <p className="mt-1 text-xs text-zinc-500">
          É o comparativo que justifica o trabalho melhor que qualquer relatório.
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-3 py-2 text-left font-medium">Indicador</th>
                <th className="px-3 py-2 text-left font-medium">Linha de base</th>
                <th className="px-3 py-2 text-left font-medium">Hoje</th>
                <th className="px-3 py-2 text-left font-medium">Movimento</th>
              </tr>
            </thead>
            <tbody>
              {previa.comparacao.map((c) => (
                <tr key={c.key} className="border-b border-zinc-800/60">
                  <td className="px-3 py-2 text-zinc-200">{c.label}</td>
                  <td className="px-3 py-2 text-zinc-500">{c.base ? FAIXA_LABELS[c.base] : "—"}</td>
                  <td className="px-3 py-2 text-zinc-300">{c.atual ? FAIXA_LABELS[c.atual] : "—"}</td>
                  <td className="px-3 py-2 text-xs">
                    {!c.evolucao ? (
                      <span className="text-zinc-600">sem comparação</span>
                    ) : c.evolucao.mudanca === "igual" ? (
                      <span className="text-zinc-500">manteve</span>
                    ) : (
                      <span className={c.evolucao.mudanca === "subiu" ? "text-emerald-400" : "text-amber-300"}>
                        {c.evolucao.mudanca === "subiu" ? "↑" : "↓"} {c.evolucao.degraus}{" "}
                        {c.evolucao.degraus === 1 ? "nível" : "níveis"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-zinc-600">
          Indicador que passou a ser avaliado no meio do caminho aparece como &quot;sem comparação&quot;, não como
          progresso — ele não subiu, passou a existir.
        </p>
      </section>

      <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="text-sm font-medium text-zinc-200">Prévia do documento</h2>
        <div className="mt-3 flex flex-col gap-4">
          {previa.content.sections.map((s) => (
            <div key={s.title}>
              <h3 className="text-xs font-medium text-indigo-300">{s.title}</h3>
              {s.body ? (
                <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-zinc-400">{s.body}</pre>
              ) : (
                <p className="mt-1 text-sm text-zinc-600">
                  Em branco — o consultor escreve ao editar o entregável.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {pfisAnteriores.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Versões já compiladas</h2>
          <ul className="flex flex-col gap-1 text-xs text-zinc-500">
            {pfisAnteriores.map((d) => (
              <li key={d.id}>
                v{d.version} — {formatDateBR(d.createdAt)}{" "}
                {d.validatedAt ? `· validado em ${formatDateBR(d.validatedAt)}` : "· rascunho"}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-zinc-600">
            Compilar de novo cria uma versão nova; nenhuma anterior é sobrescrita. Editar o texto e validar continua
            em{" "}
            <Link href="/metodo/entregaveis" className="text-indigo-300 hover:text-indigo-200">
              Entregáveis
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}
