import { requireAdminProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ExecutarAgoraButton } from "./ExecutarAgoraButton";

/**
 * Registro Nº 091 — rastro de execução do cron de automações.
 *
 * A tela existe por causa de um episódio: no Registro Nº 087 não havia como
 * distinguir **"rodou e não havia nada a alertar"** de **"não rodou"**. Uma
 * rotina que falha em silêncio é pior que uma que falha alto, porque ninguém
 * procura o que não sabe que quebrou.
 *
 * Por isso o destaque da tela não é a tabela — é a resposta à pergunta "está
 * rodando?". A tabela é a evidência embaixo.
 *
 * Admin-only: a execução atravessa todos os workspaces da plataforma.
 */

/** O cron é diário (`0 9 * * *`). Passou disto, há atraso real, não tolerância. */
const HORAS_ATE_SUSPEITAR = 26;

function formatDataHora(d: Date): string {
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
}

function duracao(inicio: Date, fim: Date | null): string {
  if (!fim) return "—";
  const seg = (fim.getTime() - inicio.getTime()) / 1000;
  return seg < 60 ? `${seg.toFixed(1)}s` : `${Math.floor(seg / 60)}min ${Math.round(seg % 60)}s`;
}

export default async function AutomacoesPage() {
  await requireAdminProfile();

  const [execucoes, regrasAtivas] = await Promise.all([
    prisma.automationRun.findMany({ orderBy: { startedAt: "desc" }, take: 30 }),
    prisma.automationRule.count({ where: { isActive: true } }),
  ]);

  const ultimoCron = execucoes.find((e) => e.source === "CRON") ?? null;
  const horasDesdeCron = ultimoCron ? (Date.now() - ultimoCron.startedAt.getTime()) / 36e5 : null;
  const atrasado = horasDesdeCron === null || horasDesdeCron > HORAS_ATE_SUSPEITAR;

  // Linha aberta e antiga = morreu no meio sem chegar ao `catch`. É a falha que
  // normalmente não deixa rastro em lugar nenhum, então merece destaque próprio.
  const travadas = execucoes.filter(
    (e) => e.finishedAt === null && (Date.now() - e.startedAt.getTime()) / 36e5 > 1,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-zinc-500">
          A verificação diária das regras de automação roda às 9h UTC (6h de Brasília) e avisa sobre limite de
          categoria, vencimento próximo, variação de recorrência, meta fora da trajetória e fila de incidentes. Ela
          nunca lança, liquida ou cancela nada — só produz alertas.
        </p>
        <ExecutarAgoraButton />
      </div>

      <div
        className={`rounded-xl border p-6 ${
          atrasado ? "border-amber-700/60 bg-amber-950/20" : "border-emerald-900/50 bg-emerald-950/10"
        }`}
      >
        <p className="text-xs text-indigo-300">Está rodando?</p>
        {ultimoCron === null ? (
          <>
            <p className="mt-1 text-2xl text-amber-200">Nenhuma execução automática registrada</p>
            <p className="mt-2 text-sm text-zinc-400">
              Ou o cron nunca rodou desde que este rastro passou a existir, ou ele não está chegando à aplicação.
              Uma execução manual aqui do lado confirma se a rotina em si funciona — se ela funcionar e a automática
              continuar ausente, o problema está no agendamento, não no código.
            </p>
          </>
        ) : (
          <>
            <p className={`mt-1 text-2xl ${atrasado ? "text-amber-200" : "text-emerald-300"}`}>
              {atrasado ? "Atrasado" : "Em dia"}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Última execução automática em{" "}
              <strong className="text-zinc-200">{formatDataHora(ultimoCron.startedAt)}</strong>
              {horasDesdeCron !== null && <> — há {horasDesdeCron.toFixed(0)}h.</>}
              {atrasado && <> O esperado é uma por dia; passou de {HORAS_ATE_SUSPEITAR}h.</>}
            </p>
          </>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          {regrasAtivas === 0
            ? "Não há nenhuma regra ativa na plataforma — então mesmo rodando, a rotina não teria o que alertar."
            : `${regrasAtivas} regra(s) ativa(s) na plataforma.`}
        </p>
      </div>

      {travadas.length > 0 && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-200">
          {travadas.length} execução(ões) começaram e nunca fecharam. Isso não é falha tratada — é a rotina tendo
          sido interrompida no meio (tempo esgotado, processo derrubado), o tipo de problema que só aparece aqui.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-3 py-2 text-left font-medium">Início</th>
              <th className="px-3 py-2 text-left font-medium">Origem</th>
              <th className="px-3 py-2 text-right font-medium">Duração</th>
              <th className="px-3 py-2 text-right font-medium">Workspaces</th>
              <th className="px-3 py-2 text-right font-medium">Regras</th>
              <th className="px-3 py-2 text-right font-medium">Alertas</th>
              <th className="px-3 py-2 text-left font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {execucoes.map((e) => (
              <tr key={e.id} className="border-b border-zinc-800/60">
                <td className="whitespace-nowrap px-3 py-2 text-zinc-300">{formatDataHora(e.startedAt)}</td>
                <td className="px-3 py-2 text-zinc-500">{e.source === "CRON" ? "Agendada" : "Manual"}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-500">
                  {duracao(e.startedAt, e.finishedAt)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-400">{e.workspacesEvaluated}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-400">{e.rulesEvaluated}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">{e.notified}</td>
                <td className="px-3 py-2">
                  {e.error ? (
                    <span className="text-red-300">Falhou — {e.error}</span>
                  ) : e.finishedAt === null ? (
                    <span className="text-amber-300">Não terminou</span>
                  ) : (
                    <span className="text-emerald-400">Concluída</span>
                  )}
                </td>
              </tr>
            ))}
            {execucoes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-zinc-500">
                  Nenhuma execução registrada ainda. O rastro passou a existir em 2026-08-17; execuções anteriores a
                  essa data aconteceram sem registro e não aparecem aqui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-600">
        Zero alertas numa execução concluída é resultado normal: significa que nenhuma condição estava verdadeira.
        O que este rastro resolve é outra coisa — antes dele, esse caso era indistinguível de a rotina não ter
        rodado.
      </p>
    </div>
  );
}
