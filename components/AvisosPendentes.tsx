import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { severityStyle, summarize, visibleTo } from "@/lib/method/notifications";

/**
 * Faixa de avisos pendentes no topo do Painel.
 *
 * A tela `/notificacoes` resolve "onde vejo os avisos"; esta faixa resolve
 * "como eu descubro que existem". Sem ela, o aviso continuaria a depender de a
 * pessoa lembrar de visitar uma tela — que é quase o mesmo que não existir, e
 * foi o defeito corrigido no Registro Nº 104.
 *
 * Some por completo quando não há nada pendente: faixa vazia treina o olho a
 * ignorar a região onde os avisos aparecem.
 */
export async function AvisosPendentes({ workspaceId }: { workspaceId: string }) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);

  const rows = await prisma.notification.findMany({
    where: { workspaceId, resolvedAt: null },
    orderBy: { createdAt: "desc" },
    take: 20,
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

  const { pendentes } = summarize(visiveis);
  if (pendentes.length === 0) return null;

  // Três é o suficiente para dar o recado sem empurrar o Painel para baixo.
  const destaque = pendentes.slice(0, 3);
  const resto = pendentes.length - destaque.length;

  return (
    <section className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium text-amber-200">
          {pendentes.length === 1 ? "1 aviso pendente" : `${pendentes.length} avisos pendentes`}
        </h2>
        <Link href="/notificacoes" className="text-xs text-indigo-300 hover:text-indigo-200">
          Ver todos →
        </Link>
      </div>

      <ul className="mt-2 flex flex-col gap-1">
        {destaque.map((n) => (
          <li key={n.id} className="text-sm text-zinc-300">
            <span className="text-xs text-amber-300/80">{severityStyle(n.severity).label}</span> — {n.message}
          </li>
        ))}
      </ul>

      {resto > 0 && (
        <p className="mt-2 text-xs text-zinc-500">e mais {resto === 1 ? "1 aviso" : `${resto} avisos`}.</p>
      )}
    </section>
  );
}
