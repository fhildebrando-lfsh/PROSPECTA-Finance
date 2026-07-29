import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function PainelPage() {
  const workspaceId = await requireWorkspaceId();

  const [categoryCount, subcategoryCount, walletCount, peopleCount, categoriesByNature] =
    await Promise.all([
      prisma.category.count(),
      prisma.subcategory.count({ where: { OR: [{ workspaceId: null }, { workspaceId }] } }),
      prisma.wallet.count({ where: { workspaceId } }),
      prisma.person.count({ where: { workspaceId } }),
      prisma.category.groupBy({ by: ["nature"], _count: true }),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Painel</h1>
        <p className="text-sm text-zinc-500">
          Fase 0 — confirma que a taxonomia carregou e que os dados abaixo pertencem só ao seu
          workspace.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Categorias" value={categoryCount} />
        <StatCard label="Subcategorias" value={subcategoryCount} />
        <StatCard label="Carteiras" value={walletCount} />
        <StatCard label="Responsáveis" value={peopleCount} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Categorias por tipo</h2>
        <ul className="flex flex-col gap-1 text-sm text-zinc-400">
          {categoriesByNature.map((row) => (
            <li key={row.nature} className="flex justify-between border-b border-zinc-800 py-1">
              <span>{row.nature}</span>
              <span className="font-mono tabular-nums">{row._count}</span>
            </li>
          ))}
        </ul>
      </div>

      {walletCount === 0 && (
        <p className="text-sm text-zinc-500">
          Nenhuma carteira ainda. Rode <code className="text-zinc-300">npm run db:seed:workspace</code>{" "}
          para carregar suas 47 carteiras e 12 responsáveis (seeds/seed_carteiras.csv,
          seeds/seed_responsaveis.csv).
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-mono text-2xl tabular-nums text-zinc-50">{value}</p>
    </div>
  );
}
