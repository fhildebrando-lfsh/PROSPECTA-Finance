import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { daysBetween } from "@/lib/finance/dates";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { CompromissosTabs } from "./CompromissosTabs";
import { CompromissosList, type CompromissoGroup } from "./CompromissosList";

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

interface SearchParams {
  from?: string;
  to?: string;
}

export default async function CompromissosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const workspaceId = await requireWorkspaceId();
  const params = await searchParams;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const where: Prisma.EntryWhereInput = { workspaceId, statusCode: { in: ["A_PAGAR", "A_RECEBER"] } };
  if (params.from || params.to) {
    where.dueDate = {
      ...(params.from ? { gte: new Date(`${params.from}T00:00:00Z`) } : {}),
      ...(params.to ? { lte: new Date(`${params.to}T00:00:00Z`) } : {}),
    };
  }

  const entries = await prisma.entry.findMany({
    where,
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

  const groups: CompromissoGroup[] = BUCKET_ORDER.map((bucket) => ({
    bucket,
    label: BUCKET_LABELS[bucket],
    highlight: bucket === "vencidos",
    entries: grouped[bucket].map((entry) => ({
      id: entry.id,
      description: entry.description,
      walletName: entry.wallet.name,
      categoryName: entry.category.name,
      responsibleName: entry.responsible.name,
      dueDateFormatted: formatDateBR(entry.dueDate),
      amountFormatted: formatCurrencyBRL(entry.amount),
      isNegative: entry.amount.isNegative(),
      statusCode: entry.statusCode,
    })),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Compromissos</h1>
        <p className="text-sm text-zinc-500">O que ainda está a pagar ou a receber, agrupado por prazo.</p>
      </div>

      <CompromissosTabs active="lista" />

      <form className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          De (vencimento)
          <input
            type="date"
            name="from"
            defaultValue={params.from}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Até (vencimento)
          <input
            type="date"
            name="to"
            defaultValue={params.to}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-zinc-100"
          />
        </label>
        <button type="submit" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800">
          Filtrar
        </button>
        {(params.from || params.to) && (
          <a href="/compromissos" className="rounded-lg px-3 py-1.5 text-zinc-500 hover:text-zinc-300">
            Limpar
          </a>
        )}
      </form>

      <CompromissosList groups={groups} />
    </div>
  );
}
