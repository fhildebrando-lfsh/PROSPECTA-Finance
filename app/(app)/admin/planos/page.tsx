import { requireAdminProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { FeatureToggleCell } from "./FeatureToggleCell";
import { GateKindSelect } from "./GateKindSelect";
import { setPlanActive } from "./actions";
import { BTN_GHOST } from "@/components/ui/buttonStyles";

/**
 * Etapa 3 do Método (ARQUITETURA-METODO-PROSPECTAR.md §3.1, 2026-08-15) —
 * painel administrativo de Planos: o admin atribui/desatribui feature↔plano
 * e decide o `gateKind` de cada feature sem precisar de deploy. O seed
 * (`prisma/seed-plans.ts`) só dá o estado inicial (6 SKUs Start/Pro/Max ×
 * Individual/Família + catálogo de §13.8) — esta tela é o que edita depois.
 */
export default async function PlanosPage() {
  await requireAdminProfile();

  const [plans, features] = await Promise.all([
    prisma.plan.findMany({
      orderBy: [{ isActive: "desc" }, { priceCents: "asc" }],
      include: { planFeatures: true },
    }),
    prisma.feature.findMany({ orderBy: [{ gateKind: "asc" }, { code: "asc" }] }),
  ]);

  const enabledSet = new Set(plans.flatMap((p) => p.planFeatures.map((pf) => `${p.id}:${pf.featureId}`)));

  /**
   * As sempre-incluídas **não entram na matriz** (decisão do usuário,
   * 2026-08-19). Elas são o produto, não um adicional — e uma chave que o admin
   * pode desmarcar sem efeito nenhum é pior que chave ausente: promete um
   * controle que não existe, que era o defeito do Registro Nº 104.
   *
   * Continuam listadas abaixo da tabela, como informação, para ninguém achar
   * que sumiram do catálogo.
   */
  const sempreIncluidas = features.filter((f) => f.alwaysIncluded);
  const planoFeatures = features.filter((f) => f.gateKind === "PLANO" && !f.alwaysIncluded);
  const metodoFeatures = features.filter((f) => f.gateKind === "METODO" && !f.alwaysIncluded);

  function FeatureRows({ list }: { list: typeof features }) {
    return (
      <>
        {list.map((feature) => (
          <tr key={feature.id} className="border-t border-indigo-900/50">
            <td className="px-3 py-1.5 text-zinc-200">
              {feature.name}
              <span className="ml-1.5 font-mono text-[10px] text-zinc-500">{feature.code}</span>
            </td>
            <td className="px-2 py-1.5">
              <GateKindSelect featureId={feature.id} gateKind={feature.gateKind} />
            </td>
            {plans.map((plan) => (
              <td key={plan.id} className="px-2 py-1.5 text-center">
                <FeatureToggleCell
                  planId={plan.id}
                  featureId={feature.id}
                  enabled={enabledSet.has(`${plan.id}:${feature.id}`)}
                />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm text-zinc-500">
        Catálogo comercial (§13.8 da Metodologia PROSPECTA v5.0). Marque quais features cada plano libera e se cada
        feature é liberada por nível de plano ou pela camada de método (só com consultor ativo — a camada de método
        ainda não está implementada, então essas features ficam bloqueadas pra todo mundo por enquanto). Mudanças
        aqui valem na hora, sem deploy.
      </p>

      <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
        {plans.map((plan) => (
          <form key={plan.id} action={setPlanActive} className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1">
            <input type="hidden" name="planId" value={plan.id} />
            <input type="hidden" name="isActive" value={plan.isActive.toString()} />
            <span className={plan.isActive ? "text-zinc-200" : "text-zinc-600 line-through"}>{plan.name}</span>
            <span className="text-zinc-600">({plan.code})</span>
            <button type="submit" className={`${BTN_GHOST} px-1.5 py-0`}>
              {plan.isActive ? "desativar" : "ativar"}
            </button>
          </form>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-indigo-900/50 bg-[#131A47]">
        <table className="w-full text-xs">
          <thead className="bg-black/20 text-left text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Feature</th>
              <th className="px-2 py-2 font-medium">Liberada por</th>
              {plans.map((plan) => (
                <th key={plan.id} className="px-2 py-2 text-center font-medium">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-indigo-900/50 bg-black/10">
              <td colSpan={2 + plans.length} className="px-3 py-1 text-[10px] uppercase tracking-wide text-indigo-300">
                Plano — Start / Pro / Max
              </td>
            </tr>
            <FeatureRows list={planoFeatures} />
            <tr className="border-t border-indigo-900/50 bg-black/10">
              <td colSpan={2 + plans.length} className="px-3 py-1 text-[10px] uppercase tracking-wide text-indigo-300">
                Método — só com ConsultingEngagement ativo (ainda não implementado, Etapa 8)
              </td>
            </tr>
            <FeatureRows list={metodoFeatures} />
          </tbody>
        </table>
      </div>
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-1 text-sm font-medium text-zinc-300">Sempre incluídas</h2>
        <p className="mb-2 text-xs text-zinc-500">
          Estas {sempreIncluidas.length} funcionalidades valem para todos os planos e não aparecem na matriz — são o
          que o sistema é, não um adicional. Não há o que marcar ou desmarcar.
        </p>
        <p className="text-xs text-zinc-600">{sempreIncluidas.map((f) => f.name).join(" · ")}</p>
      </section>

    </div>
  );
}
