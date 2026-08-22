import Link from "next/link";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateBR } from "@/lib/format";
import { podeVerInternos, severityStyle, summarize, visibleTo } from "@/lib/method/notifications";
import { BTN_GHOST, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { resolverNotificacao, resolverTodas } from "./actions";

const TONE_CLASSES: Record<string, string> = {
  info: "text-indigo-300",
  atencao: "text-amber-300",
  critico: "text-red-300",
};

/**
 * Os avisos que o sistema produz.
 *
 * Esta tela existe porque, até 2026-08-18, **ela não existia**: a rotina diária
 * gravava `Notification` e nenhuma tela lia a tabela. A Etapa 6 inteira —
 * cinco gatilhos, cron, rastro de execução — produzia alertas que ninguém via
 * (Registro Nº 104). Um sistema que se define por "avisar, nunca agir sozinho"
 * precisa, no mínimo, avisar.
 *
 * A visibilidade é filtrada por `lib/method/notifications.ts`, que é onde a
 * regra está testada — `ADVISOR_ONLY` nunca chega ao cliente.
 */
export default async function NotificacoesPage() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);

  const rows = await prisma.notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const visiveis = visibleTo(
    rows.map((n) => ({
      id: n.id,
      visibility: n.visibility,
      severity: n.severity,
      message: n.message,
      createdAt: n.createdAt,
      resolvedAt: n.resolvedAt,
    })),
    membership?.role ?? null,
    profile.isPlatformAdmin,
  );

  const s = summarize(visiveis);
  const veInternos = podeVerInternos(membership?.role ?? null, profile.isPlatformAdmin);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-zinc-500">
          Tudo que o sistema notou e achou que você deveria saber. Os avisos vêm das{" "}
          <Link href="/painel/assistente" className="text-indigo-300 hover:text-indigo-200">
            automações que você ligou
          </Link>{" "}
          e são gerados uma vez por dia. O sistema <strong className="text-zinc-400">nunca age sozinho</strong> — ele
          só avisa.
        </p>
        {s.pendentes.length > 0 && (
          <form action={resolverTodas}>
            <button type="submit" className={BTN_SECONDARY}>
              Marcar todos como lidos
            </button>
          </form>
        )}
      </div>

      {s.total === 0 ? (
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
          <p className="text-zinc-200">Nenhum aviso até agora.</p>
          <p className="mt-2">
            Isso pode significar duas coisas: nenhuma das suas regras encontrou motivo para avisar, ou você ainda não
            criou nenhuma. Dá para configurá-las na tela do{" "}
            <Link href="/painel/assistente" className="text-indigo-300 hover:text-indigo-200">
              Assistente
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-zinc-200">
              Pendentes {s.pendentes.length > 0 && <span className="text-zinc-500">({s.pendentes.length})</span>}
            </h2>

            {s.pendentes.length === 0 ? (
              <p className="text-sm text-emerald-400">Nenhum aviso pendente — todos já foram lidos.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {s.pendentes.map((n) => {
                  const st = severityStyle(n.severity);
                  return (
                    <li
                      key={n.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-xs">
                          <span className={TONE_CLASSES[st.tone]}>{st.label}</span>
                          <span className="text-zinc-600"> · {formatDateBR(n.createdAt)}</span>
                          {n.visibility === "ADVISOR_ONLY" && (
                            <span className="ml-2 rounded border border-indigo-800 px-1.5 py-0.5 text-[10px] text-indigo-300">
                              interno
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-zinc-200">{n.message}</p>
                      </div>
                      <form action={resolverNotificacao}>
                        <input type="hidden" name="id" value={n.id} />
                        <button type="submit" className={BTN_GHOST}>
                          Marcar como lido
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {s.resolvidas.length > 0 && (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <h2 className="mb-2 text-sm font-medium text-zinc-300">Já lidos</h2>
              <ul className="flex flex-col gap-1 text-xs text-zinc-500">
                {s.resolvidas.slice(0, 30).map((n) => (
                  <li key={n.id}>
                    {formatDateBR(n.createdAt)} — {n.message}{" "}
                    <span className="text-zinc-600">(lido em {formatDateBR(n.resolvedAt!)})</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-zinc-600">
                Aviso lido vira histórico, nunca é apagado — é o que permite dizer depois que aquilo já foi tratado.
              </p>
            </section>
          )}
        </>
      )}

      {veInternos && s.internos > 0 && (
        <p className="text-[11px] text-zinc-600">
          Avisos marcados como <strong className="text-zinc-500">interno</strong> são visíveis só para você como
          consultor — o cliente não os vê.
        </p>
      )}
    </div>
  );
}
