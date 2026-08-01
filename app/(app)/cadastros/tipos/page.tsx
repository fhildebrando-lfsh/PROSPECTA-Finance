import { requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { updateNatureLabel } from "./actions";

export default async function TiposPage() {
  const profile = await requireProfile();
  const isAdmin = profile.isPlatformAdmin;
  const natureLabels = await prisma.natureLabel.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500">
        As 4 naturezas (Receita, Despesa, Investimento, Outro) são fixas — toda regra de cálculo do sistema depende
        delas. {isAdmin ? "Aqui você só troca como o rótulo aparece na tela." : "Só o administrador troca o rótulo exibido."}
      </p>
      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Código</th>
              <th className="px-3 py-2 font-medium">Rótulo exibido</th>
              <th className="px-3 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {natureLabels.map((n) => (
              <tr key={n.code} className="border-t border-indigo-900/50 text-zinc-200">
                <td className="px-3 py-2 font-mono text-xs text-zinc-500">{n.code}</td>
                <td className="px-3 py-2" colSpan={2}>
                  <form action={updateNatureLabel} className="flex items-center gap-2">
                    <input type="hidden" name="code" value={n.code} />
                    <input
                      name="labelPt"
                      defaultValue={n.labelPt}
                      disabled={!isAdmin}
                      className="w-48 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 disabled:opacity-50"
                    />
                    {isAdmin && (
                      <button type="submit" className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800">
                        Salvar
                      </button>
                    )}
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
