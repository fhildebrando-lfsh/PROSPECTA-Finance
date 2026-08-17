import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { learnFromShocks, recompositionStatus, type ShockRecord } from "@/lib/method/mcrf/shock-engine";
import { ShockForm } from "./ShockForm";
import { marcarRecomposto, excluirChoque } from "./actions";

const KIND_LABELS: Record<string, string> = {
  PERDA_DE_RENDA: "Perda de renda",
  REDUCAO_DE_RENDA: "Redução de renda",
  DESPESA_INESPERADA: "Despesa inesperada",
  INCAPACIDADE: "Incapacidade",
  EMERGENCIA_FAMILIAR: "Emergência familiar",
  REPARO_ESSENCIAL: "Reparo essencial",
  OUTRO: "Outro",
};

/**
 * §13, §45 e §46 — histórico de choques reais e protocolo de recomposição.
 *
 * A tela existe para responder duas coisas: o que já aconteceu com esta família
 * (que **eleva** o piso de liquidez, §34) e se a reserva usada já foi reposta.
 *
 * §46 proíbe aprendizado opaco, e a seção "O que isso mudou no seu cálculo"
 * cumpre isso literalmente: cada conclusão aponta o evento que a produziu.
 */
export default async function EventosPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "reserva_inteligente"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O registro de eventos está disponível a partir do plano Max.</p>
        <p className="mt-2">
          O que já aconteceu com você vale mais que qualquer cenário simulado — e é por isso que ele entra no cálculo
          da sua reserva.
        </p>
      </div>
    );
  }

  const [events, people] = await Promise.all([
    prisma.shockEvent.findMany({
      where: { workspaceId },
      orderBy: { occurredAt: "desc" },
      include: { person: { select: { name: true } } },
    }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const registros = events as unknown as ShockRecord[];
  const aprendizado = learnFromShocks(registros);
  const recomposicao = recompositionStatus(registros);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Qual foi a maior despesa inesperada que você ou sua família enfrentaram nos últimos dois anos? Registrar o que
        já aconteceu deixa o cálculo da sua reserva mais preciso do que qualquer simulação — cenário é hipótese, isto
        é fato.
      </p>

      <ShockForm
        kindOptions={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))}
        personOptions={people.map((p) => ({ value: p.id, label: p.name }))}
      />

      {recomposicao.totalAReporr.greaterThan(0) && (
        <section className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-4">
          <h2 className="text-sm font-medium text-amber-200">Reserva a repor</h2>
          <p className="mt-1 font-mono text-xl tabular-nums text-zinc-100">
            {formatCurrencyBRL(recomposicao.totalAReporr)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Usar a reserva não é fracasso — é ela funcionando. O que importa é repor: {recomposicao.pendentes.length}{" "}
            evento(s) ainda aguardando recomposição.
          </p>
        </section>
      )}

      {aprendizado.explicacoes.length > 0 && (
        <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <h2 className="text-sm font-medium text-zinc-200">O que isso mudou no seu cálculo</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
            {aprendizado.explicacoes.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </section>
      )}

      {events.length === 0 ? (
        <p className="text-sm text-indigo-300">Nenhum evento registrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-indigo-900/50">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="bg-[#131A47] text-xs text-indigo-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Evento</th>
                <th className="px-3 py-2 text-left font-medium">Quando</th>
                <th className="px-3 py-2 text-right font-medium">Do seu bolso</th>
                <th className="px-3 py-2 text-right font-medium">Da reserva</th>
                <th className="px-3 py-2 text-left font-medium">Situação</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-900/40 bg-[#131A47]/50">
              {events.map((e) => {
                const usouReserva = e.reserveUsedAmount && Number(e.reserveUsedAmount) > 0;
                return (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-zinc-200">
                      {e.description}
                      <span className="block text-xs text-zinc-500">
                        {KIND_LABELS[e.kind] ?? e.kind}
                        {e.person && ` · ${e.person.name}`}
                        {e.hadInsurance === true && " · com seguro"}
                        {e.hadInsurance === false && " · sem seguro"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{formatDateBR(e.occurredAt)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-zinc-300">
                      {e.paidByUserAmount ? formatCurrencyBRL(e.paidByUserAmount) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-zinc-300">
                      {e.reserveUsedAmount ? formatCurrencyBRL(e.reserveUsedAmount) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {!usouReserva ? (
                        <span className="text-zinc-500">—</span>
                      ) : e.recomposedAt ? (
                        <span className="text-emerald-400">Reposta em {formatDateBR(e.recomposedAt)}</span>
                      ) : (
                        <form action={marcarRecomposto}>
                          <input type="hidden" name="id" value={e.id} />
                          <button type="submit" className="text-amber-300 hover:text-amber-200">
                            marcar como reposta
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <form action={excluirChoque}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="text-xs text-zinc-500 hover:text-red-400">
                          excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
