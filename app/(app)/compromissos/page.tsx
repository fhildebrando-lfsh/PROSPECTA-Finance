import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { daysBetween } from "@/lib/finance/dates";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { markSettled } from "./actions";

type Bucket = "vencidos" | "hoje" | "proximos7" | "proximos30";

const BUCKET_LABELS: Record<Bucket, string> = {
  vencidos: "Vencidos",
  hoje: "Hoje",
  proximos7: "Próximos 7 dias",
  proximos30: "Próximos 30 dias",
};

const BUCKET_ORDER: Bucket[] = ["vencidos", "hoje", "proximos7", "proximos30"];

/** §13 — vencidos, hoje, próximos 7/30 dias. */
function bucketFor(days: number): Bucket | null {
  if (days < 0) return "vencidos";
  if (days === 0) return "hoje";
  if (days <= 7) return "proximos7";
  if (days <= 30) return "proximos30";
  return null;
}

export default async function CompromissosPage() {
  const workspaceId = await requireWorkspaceId();

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const entries = await prisma.entry.findMany({
    where: { workspaceId, statusCode: { in: ["A_PAGAR", "A_RECEBER"] } },
    include: { wallet: true, category: true, responsible: true },
    orderBy: { dueDate: "asc" },
  });

  const grouped: Record<Bucket, typeof entries> = {
    vencidos: [],
    hoje: [],
    proximos7: [],
    proximos30: [],
  };

  for (const entry of entries) {
    const bucket = bucketFor(daysBetween(today, entry.dueDate));
    if (bucket) grouped[bucket].push(entry);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Compromissos</h1>
        <p className="text-sm text-zinc-500">O que ainda está a pagar ou a receber, agrupado por prazo (§13).</p>
      </div>

      <div className="flex gap-2 text-sm">
        <span className="rounded-lg bg-amber-500 px-3 py-1.5 font-medium text-zinc-950">Lista</span>
        <Link
          href="/compromissos/calendario"
          className="rounded-lg px-3 py-1.5 text-indigo-200 hover:bg-indigo-900/50 hover:text-white"
        >
          Calendário
        </Link>
      </div>

      {BUCKET_ORDER.map((bucket) => (
        <div key={bucket}>
          <h2
            className={`mb-2 text-sm font-medium ${bucket === "vencidos" ? "text-rose-400" : "text-zinc-300"}`}
          >
            {BUCKET_LABELS[bucket]} ({grouped[bucket].length})
          </h2>
          {grouped[bucket].length === 0 ? (
            <p className="text-sm text-zinc-600">Nada aqui.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {grouped[bucket].map((entry) => (
                <div
                  key={entry.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${
                    bucket === "vencidos" ? "border-rose-900 bg-rose-950/30" : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-zinc-100">{entry.description}</p>
                    <p className="text-xs text-zinc-500">
                      {entry.wallet.name} · {entry.category.name} · {entry.responsible.name} · vence{" "}
                      {formatDateBR(entry.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono text-sm tabular-nums ${
                        entry.amount.isNegative() ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {formatCurrencyBRL(entry.amount)}
                    </span>
                    <form action={markSettled}>
                      <input type="hidden" name="id" value={entry.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400"
                      >
                        {entry.statusCode === "A_RECEBER" ? "Marcar como recebido" : "Marcar como pago"}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
