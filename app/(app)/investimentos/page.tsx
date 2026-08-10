import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { investmentAcquisitionValue, investmentPositionValue, investmentReturnPct } from "@/lib/finance/investment";
import { formatCurrencyBRL } from "@/lib/format";

export default async function InvestimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>;
}) {
  const { classe } = await searchParams;
  const workspaceId = await requireWorkspaceId();

  const [investments, classes, positionEntries] = await Promise.all([
    prisma.investment.findMany({
      where: { workspaceId, isActive: true, ...(classe ? { classCode: classe } : {}) },
      include: { class: true, wallet: true },
      orderBy: { name: "asc" },
    }),
    prisma.investmentClass.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.entry.findMany({
      where: { workspaceId, investmentId: { not: null }, nature: "INVESTIMENTO" },
      select: { investmentId: true, amount: true, category: { select: { slug: true } } },
    }),
  ]);

  const entriesByInvestment = new Map<string, { amount: (typeof positionEntries)[number]["amount"]; categorySlug: string }[]>();
  for (const e of positionEntries) {
    if (!e.investmentId) continue;
    const list = entriesByInvestment.get(e.investmentId) ?? [];
    list.push({ amount: e.amount, categorySlug: e.category.slug });
    entriesByInvestment.set(e.investmentId, list);
  }

  const rows = investments.map((inv) => {
    const entries = entriesByInvestment.get(inv.id) ?? [];
    const acquisitionValue = investmentAcquisitionValue(entries);
    const currentValue = investmentPositionValue(entries);
    const returnPct = investmentReturnPct(entries);
    return {
      id: inv.id,
      name: inv.name,
      classLabel: inv.class.labelPt,
      walletName: inv.wallet.name,
      acquisitionValueFormatted: formatCurrencyBRL(acquisitionValue),
      currentValueFormatted: formatCurrencyBRL(currentValue),
      returnPct,
      isPositive: returnPct.gte(0),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Suas posições de investimento, num só lugar — clique numa para ver o histórico completo.
        </p>
        <a
          href="/investimentos/novo"
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
        >
          + Novo investimento
        </a>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-zinc-400">
          Filtrar por classe
          <select
            name="classe"
            defaultValue={classe ?? ""}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
          >
            <option value="">Todas as classes</option>
            {classes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.labelPt}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg border border-indigo-900/50 px-3 py-1.5 text-xs text-indigo-200 hover:bg-indigo-900/50">
          Filtrar
        </button>
        {classe && (
          <a href="/investimentos" className="rounded-lg border border-indigo-900/50 px-3 py-1.5 text-xs text-indigo-300 hover:bg-indigo-900/50">
            Limpar filtro
          </a>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-indigo-300">
          Nenhum investimento cadastrado ainda —{" "}
          <a href="/investimentos/novo" className="underline hover:text-white">
            cadastre o primeiro
          </a>
          .
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Link
              key={r.id}
              href={`/investimentos/${r.id}`}
              className="flex flex-col gap-2 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4 hover:border-indigo-600"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">{r.name}</p>
                  <p className="text-xs text-indigo-300">{r.classLabel}</p>
                </div>
                <span className="shrink-0 rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] text-indigo-200">{r.walletName}</span>
              </div>
              <div className="mt-1 flex items-end justify-between">
                <div>
                  <p className="text-[11px] text-zinc-500">Investido</p>
                  <p className="font-mono text-sm tabular-nums text-zinc-300">{r.acquisitionValueFormatted}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-500">Valor atual</p>
                  <p className="font-mono text-base tabular-nums text-zinc-100">{r.currentValueFormatted}</p>
                </div>
              </div>
              <p className={`text-right font-mono text-sm tabular-nums ${r.isPositive ? "text-emerald-400" : "text-red-400"}`}>
                {r.isPositive ? "+" : ""}
                {r.returnPct.toFixed(1)}%
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
