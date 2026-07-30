import { requireAdminProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { updateNatureLabel } from "./actions";

export default async function TiposPage() {
  await requireAdminProfile();
  const natureLabels = await prisma.natureLabel.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500">
        As 4 naturezas (Receita, Despesa, Investimento, Outro) são fixas — toda regra de cálculo do sistema depende
        delas. Aqui você só troca como o rótulo aparece na tela.
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Rótulo exibido</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {natureLabels.map((n) => (
              <tr key={n.code} className="border-t border-zinc-800 text-zinc-200">
                <td className="px-3 py-2 font-mono text-xs text-zinc-500">{n.code}</td>
                <td className="px-3 py-2" colSpan={2}>
                  <form action={updateNatureLabel} className="flex items-center gap-2">
                    <input type="hidden" name="code" value={n.code} />
                    <input
                      name="labelPt"
                      defaultValue={n.labelPt}
                      className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                    />
                    <button type="submit" className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">
                      Salvar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
