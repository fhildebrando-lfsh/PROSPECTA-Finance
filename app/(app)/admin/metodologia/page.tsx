import { requireAdminProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { METHODOLOGY_VERSION } from "@/lib/method/mcrf/config";
import { BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { updateMethodologyParameter } from "./actions";
import { RigidezSelect } from "./RigidezSelect";

const RIGIDEZ_LABELS: Record<string, string> = {
  RIGIDA: "Rígida",
  AJUSTAVEL: "Ajustável",
  DISCRICIONARIA: "Discricionária",
};

/**
 * Etapa 9-A.3 (PROSPECTA-MCRF §52) — parâmetros da metodologia, admin-only.
 *
 * Existe porque o usuário decidiu (2026-08-16) que rigidez e percentual de
 * redução são **globais**, não configuração por workspace: metodologia que
 * muda por cliente deixa de ser metodologia. Guardado por
 * `requireAdminProfile()`, o mesmo de `/admin/planos`.
 */
export default async function MetodologiaPage() {
  await requireAdminProfile();

  const [parameters, subcategories] = await Promise.all([
    prisma.methodologyParameter.findMany({ orderBy: { key: "asc" } }),
    prisma.subcategory.findMany({
      where: { workspaceId: null, category: { nature: "DESPESA" } },
      select: {
        id: true,
        name: true,
        rigidez: true,
        macroBloco: true,
        category: { select: { name: true, sortOrder: true } },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
  ]);

  const porCategoria = new Map<string, typeof subcategories>();
  for (const s of subcategories) {
    const list = porCategoria.get(s.category.name) ?? [];
    list.push(s);
    porCategoria.set(s.category.name, list);
  }

  const contagem = {
    RIGIDA: subcategories.filter((s) => s.rigidez === "RIGIDA").length,
    AJUSTAVEL: subcategories.filter((s) => s.rigidez === "AJUSTAVEL").length,
    DISCRICIONARIA: subcategories.filter((s) => s.rigidez === "DISCRICIONARIA").length,
    SEM: subcategories.filter((s) => s.rigidez === null).length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">Metodologia</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-500">
          Parâmetros do cálculo de risco e reserva. Valem para <strong>todo o sistema</strong> — não são configuração
          de cliente. Metodologia versão <span className="font-mono text-xs">{METHODOLOGY_VERSION}</span>.
        </p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Parâmetros de cálculo</h2>
        {parameters.length === 0 ? (
          <p className="text-sm text-indigo-300">
            Nenhum parâmetro semeado ainda. Rode <span className="font-mono text-xs">npm run db:seed:rigidez</span>.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {parameters.map((p) => (
              <form
                key={p.key}
                action={updateMethodologyParameter}
                className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4"
              >
                <input type="hidden" name="key" value={p.key} />
                <p className="text-sm text-zinc-200">{p.label}</p>
                {p.description && <p className="mt-1 max-w-3xl text-xs text-zinc-500">{p.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    defaultValue={p.value.toString()}
                    className="w-28 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100"
                  />
                  <button type="submit" className={`${BTN_SECONDARY} px-3 py-1.5 text-xs`}>
                    Salvar
                  </button>
                  <span className="font-mono text-[11px] text-zinc-600">{p.key}</span>
                </div>
              </form>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-300">Rigidez das despesas</h2>
        <p className="mb-3 mt-1 max-w-3xl text-xs text-zinc-500">
          Como cada despesa se comporta quando a renda aperta. <strong>Rígida</strong> não cede (contrato de valor
          fixo); <strong>ajustável</strong> comprime pelo percentual acima; <strong>discricionária</strong> pode ser
          suspensa. É o que separa o custo essencial normal do custo durante uma crise — e portanto o que dimensiona a
          reserva.
        </p>

        <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-400">
          <span>Rígidas: <strong className="text-zinc-200">{contagem.RIGIDA}</strong></span>
          <span>Ajustáveis: <strong className="text-zinc-200">{contagem.AJUSTAVEL}</strong></span>
          <span>Discricionárias: <strong className="text-zinc-200">{contagem.DISCRICIONARIA}</strong></span>
          {contagem.SEM > 0 && <span className="text-amber-300">Sem classificação: {contagem.SEM}</span>}
        </div>

        <div className="flex flex-col gap-2">
          {[...porCategoria.entries()].map(([categoria, subs]) => (
            <details key={categoria} className="rounded-xl border border-indigo-900/50 bg-[#131A47]">
              <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-200">
                {categoria}{" "}
                <span className="text-xs text-zinc-500">
                  · {subs.length} subcategoria(s) ·{" "}
                  {subs.filter((s) => s.rigidez === "RIGIDA").length} rígida(s)
                </span>
              </summary>
              <div className="overflow-x-auto border-t border-indigo-900/40">
                <table className="w-full min-w-[32rem] text-sm">
                  <tbody className="divide-y divide-indigo-900/30">
                    {subs.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-2 text-zinc-200">{s.name}</td>
                        <td className="px-4 py-2 text-xs text-zinc-500">{s.macroBloco ?? "—"}</td>
                        <td className="px-4 py-2 text-xs text-zinc-500">
                          {s.rigidez ? RIGIDEZ_LABELS[s.rigidez] : "—"}
                        </td>
                        <td className="px-4 py-2">
                          <RigidezSelect id={s.id} current={s.rigidez ?? ""} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
