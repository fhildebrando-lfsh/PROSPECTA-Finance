import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { GateAviso } from "@/components/method/GateAviso";
import { activeEngagement } from "@/lib/billing/engagement";
import { formatDateBR } from "@/lib/format";
import { INSTRUMENTS, INSTRUMENT_CODES } from "@/lib/method/instruments/catalog";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";

/**
 * Etapa 10 (§12) — o Diagnóstico Integrado PROSPECTA.
 *
 * Três camadas, em momentos diferentes: **A1** antes da entrevista (hard facts
 * essenciais), **A2** depois dela (hard facts detalhados) e **C** em paralelo
 * (camada comportamental). A separação não é burocracia — §12.2 explica que ela
 * neutraliza dois vieses opostos: "no formulário ele omite o que é vergonhoso;
 * na entrevista ele erra o que é numérico".
 *
 * O B não aparece aqui: §12.5 é explícito em que é de uso interno e nunca
 * entregue ao cliente.
 *
 * Gateado por `diagnostico_dip` (`gateKind = METODO`): só existe com contrato
 * de consultoria ativo.
 */
export default async function InstrumentosPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "diagnostico_dip"))) {
    return (
      <GateAviso
        workspaceId={workspaceId}
        titulo="O diagnóstico do método existe quando há uma consultoria ativa."
        explicacao="São os formulários que o consultor usa para conhecer sua situação antes e depois da entrevista — e a parte comportamental, que nenhum extrato bancário mostra."
      />
    );
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) return <p className="text-sm text-indigo-300">Nenhum contrato de consultoria ativo.</p>;

  const respostas = await prisma.diagnosticResponse.findMany({
    where: { engagementId: engagement.id },
    orderBy: { respondedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        O diagnóstico acontece em camadas, e cada uma pergunta o que a outra não consegue. O A1 vem antes da
        entrevista e é curto de propósito; o A2 vem depois, com calma, e é onde entra o detalhe; o C é sobre como
        você se relaciona com dinheiro — e por isso é respondido sozinho.
      </p>

      <div className="flex flex-col gap-4">
        {INSTRUMENT_CODES.map((code) => {
          const spec = INSTRUMENTS[code];
          const minhas = respostas.filter((r) => r.instrument === code);
          const enviadas = minhas.filter((r) => r.submittedAt !== null);
          const rascunho = minhas.find((r) => r.submittedAt === null);

          return (
            <section key={code} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-indigo-300">
                    Instrumento {code} · Fase {spec.phase}
                    {spec.estimatedMinutes !== null && <> · cerca de {spec.estimatedMinutes} min</>}
                  </p>
                  <h2 className="mt-0.5 text-sm font-medium text-zinc-100">{spec.name}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-400">{spec.purpose}</p>
                </div>

                <Link href={`/metodo/instrumentos/${code}`} className={BTN_SECONDARY}>
                  {enviadas.length > 0 ? "Ver respostas" : rascunho ? "Continuar" : "Responder"}
                </Link>
              </div>

              <p className="mt-3 text-xs">
                {enviadas.length > 0 ? (
                  <span className="text-emerald-400">
                    {code === "C" && enviadas.length > 1
                      ? `${enviadas.length} respostas enviadas`
                      : `Enviado em ${formatDateBR(enviadas[0].submittedAt!)}`}
                  </span>
                ) : rascunho ? (
                  <span className="text-amber-300">Rascunho salvo, ainda não enviado</span>
                ) : (
                  <span className="text-zinc-500">Ainda não respondido</span>
                )}
              </p>
            </section>
          );
        })}
      </div>

      <p className="max-w-3xl text-xs text-zinc-600">
        Existe um quarto instrumento, o <strong className="text-zinc-500">B</strong> — o roteiro da entrevista. Ele
        não aparece aqui porque é conduzido como conversa pelo consultor e preenchido por ele depois da reunião:
        preencher formulário na frente do cliente destrói a conversa.
      </p>
    </div>
  );
}
