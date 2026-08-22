import Link from "next/link";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { JANELA_SESSAO_MIN, actionLabel, summarizeAccess } from "@/lib/audit/access-summary";

function dataHora(d: Date): string {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
}

function hora(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

/**
 * Quem acessou este workspace.
 *
 * O manual §17 promete que "todo acesso de um consultor ou administrador ao seu
 * workspace fica registrado". Até 2026-08-18 a promessa era **literalmente
 * verdadeira e praticamente vazia**: `AccessLog` era escrito e nunca lido, por
 * ninguém — nem pelo titular, que é o interessado (Registro Nº 105).
 *
 * O acesso do próprio titular **não** é registrado, e isso é decisão de
 * desenho, não lacuna: seria ruído, e o objetivo da auditoria é o acesso de
 * terceiro. A tela diz isso, para a ausência não parecer falha.
 */
export default async function AcessosPage() {
  const workspaceId = await requireWorkspaceId();
  await requireProfile();

  const logs = await prisma.accessLog.findMany({
    where: { workspaceId },
    orderBy: { occurredAt: "desc" },
    take: 500,
  });

  const resumo = summarizeAccess(
    logs.map((l) => ({
      id: l.id,
      actorProfileId: l.actorProfileId,
      actorRole: l.actorRole,
      action: l.action,
      occurredAt: l.occurredAt,
    })),
  );

  // Nome e e-mail vêm de duas origens — `Profile` e o Supabase Auth —, e sem os
  // dois um registro diria apenas "alguém acessou", que não é auditoria.
  const ids = [...new Set(logs.map((l) => l.actorProfileId))];
  const [perfis, auth] = await Promise.all([
    ids.length > 0 ? prisma.profile.findMany({ where: { id: { in: ids } } }) : Promise.resolve([]),
    ids.length > 0 ? createAdminClient().auth.admin.listUsers({ perPage: 1000 }) : Promise.resolve(null),
  ]);

  const nomePorId = new Map(perfis.map((p) => [p.id, p.fullName ?? null]));
  const emailPorId = new Map((auth?.data.users ?? []).map((u) => [u.id, u.email ?? null]));

  function identifica(id: string): string {
    const nome = nomePorId.get(id);
    const email = emailPorId.get(id);
    if (nome && email) return `${nome} (${email})`;
    return nome ?? email ?? "(pessoa removida do sistema)";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/minha-conta" className="text-xs text-indigo-300 hover:text-indigo-200">
          ← Minha conta
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-zinc-100">Quem acessou meus dados</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-500">
          Todo acesso de um consultor ou administrador a este workspace fica registrado, e esta tela é onde você
          consulta. <strong className="text-zinc-400">Os seus próprios acessos não aparecem</strong> — a auditoria
          existe para o acesso de terceiros; registrar os seus só produziria ruído.
        </p>
      </div>

      {resumo.sessoes.length === 0 && resumo.eventos.length === 0 ? (
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/10 p-6 text-sm text-zinc-400">
          <p className="text-emerald-300">Ninguém além de você acessou este workspace.</p>
          <p className="mt-2">
            Se um consultor for atribuído à sua conta, cada acesso dele aparecerá aqui, com data e hora.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card label="Pessoas com acesso registrado" value={String(resumo.atoresDistintos)} />
            <Card label="Visitas registradas" value={String(resumo.sessoes.length)} />
            <Card
              label="Acesso mais recente"
              value={resumo.ultimoAcesso ? dataHora(resumo.ultimoAcesso) : "—"}
            />
          </div>

          {resumo.eventos.length > 0 && (
            <section className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-4">
              <h2 className="text-sm font-medium text-amber-200">Mudanças de permissão</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Estas são as mais importantes: registram quando alguém passou a poder editar seus lançamentos, e
                quando isso foi revogado.
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-300">
                {resumo.eventos.map((e) => (
                  <li key={e.id}>
                    <span className="text-zinc-500">{dataHora(e.occurredAt)}</span> — {identifica(e.actorProfileId)}:{" "}
                    {actionLabel(e.action)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-2 text-sm font-medium text-zinc-200">Visitas</h2>
            <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
              <table className="w-full min-w-[38rem] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                    <th className="px-3 py-2 text-left font-medium">Quem</th>
                    <th className="px-3 py-2 text-left font-medium">Quando</th>
                    <th className="px-3 py-2 text-right font-medium">Telas abertas</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.sessoes.map((s) => (
                    <tr key={`${s.actorProfileId}-${s.inicio.toISOString()}`} className="border-b border-zinc-800/60">
                      <td className="px-3 py-2 text-zinc-200">{identifica(s.actorProfileId)}</td>
                      <td className="px-3 py-2 text-zinc-400">
                        {dataHora(s.inicio)}
                        {s.fim.getTime() !== s.inicio.getTime() && (
                          <span className="text-zinc-600">
                            {" "}
                            até {mesmoDia(s.inicio, s.fim) ? hora(s.fim) : dataHora(s.fim)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-500">
                        {s.visualizacoes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">
              Acessos seguidos da mesma pessoa, com menos de {JANELA_SESSAO_MIN} minutos entre um e outro, aparecem
              como uma visita só — cada tela aberta gera um registro, e listá-los um a um encheria a página sem dizer
              mais nada.
            </p>
          </section>
        </>
      )}

      <p className="max-w-3xl text-xs text-zinc-600">
        O registro guarda quem, quando e o quê — não o conteúdo consultado. A lista mostra os 500 acessos mais
        recentes.
      </p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <p className="text-xs text-indigo-300">{label}</p>
      <p className="mt-1 text-sm text-zinc-100">{value}</p>
    </div>
  );
}
