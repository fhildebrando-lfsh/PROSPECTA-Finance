import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { registerValuationAction, updateAssetAction, deleteAssetAction } from "../actions";

const STATUS_LABEL: Record<string, string> = { AQUISICAO: "Aquisição", ATUALIZACAO: "Reavaliação" };

/** As 6 categorias "Bens*" já seedadas em OUTRO (§7.4) — mesma lista de app/(app)/patrimonio/bens/page.tsx. */
const ASSET_CATEGORY_SLUGS = [
  "bens_numerarios",
  "bens_de_renda",
  "bens_de_uso_tangivel",
  "bens_de_uso_intangivel",
  "bens_de_venda",
  "bens",
];

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspaceId = await requireWorkspaceId();

  const [asset, people, categories, entries] = await Promise.all([
    prisma.asset.findFirst({ where: { id, workspaceId }, include: { category: true } }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({
      where: { nature: "OUTRO", slug: { in: ASSET_CATEGORY_SLUGS } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.entry.findMany({
      where: { workspaceId, assetId: id },
      include: { responsible: true },
      orderBy: { dueDate: "asc" },
    }),
  ]);

  if (!asset) notFound();

  const currentValue = assetCurrentValue(
    entries.map((e): AssetValuationEntry => ({ id: e.id, assetId: e.assetId, amount: e.amount, status: e.statusCode as AssetValuationEntry["status"] })),
  );

  let running = new Decimal(0);
  const history = entries.map((e) => {
    running = running.plus(e.amount);
    return { ...e, runningBalance: running };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/patrimonio/bens" className="text-sm text-indigo-300 hover:text-white">
          ← Bens
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{asset.name}</h2>
          <p className="text-xs text-indigo-300">{asset.category.name}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-indigo-300">Valor atual</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{formatCurrencyBRL(currentValue)}</p>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-indigo-900/50 text-left text-indigo-300">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Responsável</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
              <th className="px-3 py-2 text-right font-medium">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b border-indigo-900/30 text-indigo-100 last:border-0">
                <td className="px-3 py-2">{formatDateBR(h.dueDate)}</td>
                <td className="px-3 py-2 text-xs text-zinc-400">{STATUS_LABEL[h.statusCode] ?? h.statusCode}</td>
                <td className="px-3 py-2 text-xs text-zinc-400">{h.responsible.name}</td>
                <td className={`px-3 py-2 text-right font-mono tabular-nums ${h.amount.isNegative() ? "text-red-400" : "text-emerald-400"}`}>
                  {formatCurrencyBRL(h.amount)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">{formatCurrencyBRL(h.runningBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Registrar valorização/desvalorização</h2>
        <form action={registerValuationAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="assetId" value={asset.id} />
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Tipo
            <select name="kind" className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100">
              <option value="valorizacao">Valorização</option>
              <option value="desvalorizacao">Desvalorização</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Data
            <input
              type="date"
              name="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Valor
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              required
              className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
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
          <button type="submit" className={BTN_PRIMARY}>
            Registrar
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <h2 className="mb-3 text-sm font-medium text-zinc-300">Editar bem</h2>
        <form action={updateAssetAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={asset.id} />
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Nome
            <input
              name="name"
              defaultValue={asset.name}
              required
              className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Categoria
            <select
              name="categoryId"
              defaultValue={asset.categoryId}
              required
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={BTN_GHOST}>
            Salvar
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-red-900/50 bg-[#131A47] p-4">
        <h2 className="mb-1 text-sm font-medium text-red-300">Excluir bem</h2>
        <p className="mb-3 text-xs text-zinc-400">
          Apaga o bem e todo o histórico de valorizações ligado a ele — não pode ser desfeito. Se o bem existiu de
          verdade e você só não o tem mais (ex.: vendeu), prefira &ldquo;Arquivar&rdquo; na lista de Bens, que mantém o histórico.
        </p>
        <form action={deleteAssetAction}>
          <input type="hidden" name="id" value={asset.id} />
          <button type="submit" className={BTN_DANGER}>
            Excluir permanentemente
          </button>
        </form>
      </div>
    </div>
  );
}
