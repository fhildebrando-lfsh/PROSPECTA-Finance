import { requireWorkspaceId } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { assetCurrentValue, patrimonyEvolution, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { MonthlyChart, type MonthlyChartPoint } from "@/components/charts/MonthlyChart";
import { createAssetAction } from "./actions";
import { AssetCard } from "./AssetCard";

/** As 6 categorias "Bens*" já seedadas em OUTRO (§7.4) — nenhuma categoria nova criada aqui. */
const ASSET_CATEGORY_SLUGS = [
  "bens_numerarios",
  "bens_de_renda",
  "bens_de_uso_tangivel",
  "bens_de_uso_intangivel",
  "bens_de_venda",
  "bens",
];

export default async function BensPage() {
  const workspaceId = await requireWorkspaceId();
  // Registro Nº 108 — a feature existia no catálogo e nenhuma tela a
  // consultava: desmarcá-la em /admin/planos não tinha efeito nenhum.
  if (!(await hasFeature(workspaceId, "patrimonio_bens"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O cadastro de Bens está disponível a partir do plano Pro.</p>
        <p className="mt-2">É onde imóveis, veículos e outros bens entram no seu patrimônio, com valor atualizável ao longo do tempo.</p>
      </div>
    );
  }

  const [assets, categories, people, linkedEntries] = await Promise.all([
    prisma.asset.findMany({ where: { workspaceId }, include: { category: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({
      where: { nature: "OUTRO", slug: { in: ASSET_CATEGORY_SLUGS } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.entry.findMany({
      where: { workspaceId, assetId: { not: null } },
      select: { id: true, assetId: true, amount: true, statusCode: true, dueDate: true },
    }),
  ]);

  const entriesByAsset = new Map<string, AssetValuationEntry[]>();
  for (const e of linkedEntries) {
    const list = entriesByAsset.get(e.assetId!) ?? [];
    list.push({ id: e.id, assetId: e.assetId, amount: e.amount, status: e.statusCode as AssetValuationEntry["status"] });
    entriesByAsset.set(e.assetId!, list);
  }

  const rows = assets.map((a) => ({
    ...a,
    currentValue: assetCurrentValue(entriesByAsset.get(a.id) ?? []),
  }));

  const totalPatrimony = rows
    .filter((r) => r.isActive)
    .reduce((sum, r) => sum.plus(r.currentValue), new Decimal(0));

  const evolution = patrimonyEvolution(
    linkedEntries.map((e) => ({
      id: e.id,
      assetId: e.assetId,
      amount: e.amount,
      status: e.statusCode as AssetValuationEntry["status"],
      date: e.dueDate,
    })),
  );
  const evolutionChartData: MonthlyChartPoint[] = evolution.map((p) => ({
    label: formatDateBR(p.date),
    receita: 0,
    despesa: 0,
    saldo: p.cumulative.toNumber(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <div>
          <p className="text-xs text-indigo-300">Patrimônio total (bens ativos)</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(totalPatrimony)}</p>
        </div>
        <a href="/api/patrimonio/bens/pdf" className={BTN_PRIMARY}>
          Baixar PDF
        </a>
      </div>

      {evolutionChartData.length >= 2 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Evolução patrimonial</h2>
          <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <MonthlyChart data={evolutionChartData} />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <AssetCard
            key={r.id}
            asset={{
              id: r.id,
              name: r.name,
              categoryId: r.categoryId,
              currentValueFormatted: formatCurrencyBRL(r.currentValue),
              isActive: r.isActive,
            }}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        ))}
        {rows.length === 0 && <p className="text-sm text-indigo-300">Nenhum bem cadastrado ainda.</p>}
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Novo bem</h2>
        <form action={createAssetAction} className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome
            <input name="name" required className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Categoria
            <select name="categoryId" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Responsável
            <select name="responsibleId" required className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data de aquisição
            <input
              type="date"
              name="acquisitionDate"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Valor de aquisição
            <input
              type="number"
              name="acquisitionAmount"
              min="0"
              step="0.01"
              required
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            Criar
          </button>
        </form>
      </div>
    </div>
  );
}
