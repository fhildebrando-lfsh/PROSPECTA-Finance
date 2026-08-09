import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDateBR } from "@/lib/format";
import { ImportWizard } from "./ImportWizard";
import { revertBatch } from "./actions";

export default async function ImportarPage() {
  const workspaceId = await requireWorkspaceId();

  const [batches, wallets, people, categories] = await Promise.all([
    prisma.importBatch.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.wallet.findMany({ where: { workspaceId, isActive: true }, orderBy: { name: "asc" } }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: [{ nature: "asc" }, { sortOrder: "asc" }] }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Importar planilha</h1>
        <p className="text-sm text-zinc-500">
          Exporte a aba <code className="text-zinc-300">DADOS</code> em CSV e envie aqui (§18.1), ou envie um
          extrato bancário em OFX (§18) — categorias são sugeridas pelo histórico de descrições já usadas neste
          workspace.
        </p>
      </div>

      <ImportWizard
        wallets={wallets.map((w) => ({ id: w.id, name: w.name }))}
        people={people.map((p) => ({ id: p.id, name: p.name }))}
        categories={categories.map((c) => ({ id: c.id, nature: c.nature, name: c.name }))}
      />

      {batches.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Lotes importados</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Arquivo</th>
                  <th className="px-3 py-2 text-right font-medium">Importados</th>
                  <th className="px-3 py-2 text-right font-medium">Erros</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-t border-zinc-800 text-zinc-200">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs tabular-nums">
                      {formatDateBR(batch.createdAt)}
                    </td>
                    <td className="px-3 py-2">{batch.originalFilename}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{batch.importedCount}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{batch.errorCount}</td>
                    <td className="px-3 py-2 text-right">
                      {batch.revertedAt ? (
                        <span className="text-xs text-zinc-500">revertido</span>
                      ) : (
                        <form action={revertBatch}>
                          <input type="hidden" name="batchId" value={batch.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-red-900 px-2 py-1 text-xs text-red-400 hover:bg-red-950"
                          >
                            Reverter
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
