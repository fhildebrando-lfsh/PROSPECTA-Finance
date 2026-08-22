import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import type { MacroBloco } from "@/app/generated/prisma/enums";
import {
  MACRO_BLOCOS,
  MACRO_BLOCO_LABELS,
  compareToTargets,
  horizontesDefinidos,
  type TargetInput,
} from "@/lib/method/allocation-target";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { salvarMetasDaRegua } from "./target-actions";

const INPUT =
  "w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-indigo-500";

function rotuloHorizonte(h: number | null): string {
  if (h === null) return "Hoje";
  return h === 12 ? "Em 12 meses" : h === 24 ? "Em 24 meses" : `Em ${h} meses`;
}

/**
 * Etapa 14 (§11.4) — a **trajetória** de metas da Régua.
 *
 * A Régua já mostrava a distribuição atual contra a banda de referência da
 * faixa de renda. O que faltava era a meta **deste cliente**, com prazo: §11.4
 * pede hoje / 12 meses / 24 meses, porque a Régua "é instrumento de diagnóstico
 * e trajetória, nunca norma". Cobrar a banda genérica de imediato produziria
 * exatamente a frustração que o texto de origem manda evitar.
 *
 * Gateada por `regua_trajetoria` — a posição atual continua sendo de plano.
 */
export async function MetasSection({
  workspaceId,
  actualPercent,
}: {
  workspaceId: string;
  actualPercent: Record<MacroBloco, number>;
}) {
  if (!(await hasFeature(workspaceId, "regua_trajetoria"))) return null;

  const rows = await prisma.allocationTarget.findMany({ where: { workspaceId } });
  const targets: TargetInput[] = rows.map((r) => ({
    macroBloco: r.macroBloco,
    targetPercent: r.targetPercent.toNumber(),
    horizonMonths: r.horizonMonths,
  }));

  const horizontes = horizontesDefinidos(targets);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <div>
        <h2 className="text-sm font-medium text-zinc-200">Trajetória de metas</h2>
        <p className="mt-1 max-w-3xl text-xs text-zinc-500">
          A banda de referência acima vale para a faixa de renda; esta é a meta{" "}
          <strong className="text-zinc-400">deste cliente</strong>, com prazo. A Régua é instrumento de diagnóstico e
          trajetória, nunca norma — cobrar o ideal de imediato só produz frustração e abandono.
        </p>
      </div>

      {horizontes.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma meta definida ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-3 py-2 text-left font-medium">Macrobloco</th>
                <th className="px-3 py-2 text-right font-medium">Hoje</th>
                {horizontes.map((h) => (
                  <th key={String(h)} className="px-3 py-2 text-right font-medium">
                    {rotuloHorizonte(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MACRO_BLOCOS.map((mb) => (
                <tr key={mb} className="border-b border-zinc-800/60">
                  <td className="px-3 py-2 text-zinc-200">{MACRO_BLOCO_LABELS[mb]}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-300">
                    {(actualPercent[mb] ?? 0).toFixed(1)}%
                  </td>
                  {horizontes.map((h) => {
                    const linha = compareToTargets(actualPercent, targets, h).find((c) => c.macroBloco === mb)!;
                    return (
                      <td key={String(h)} className="px-3 py-2 text-right font-mono tabular-nums">
                        {linha.targetPercent === null ? (
                          <span className="text-zinc-600">—</span>
                        ) : (
                          <>
                            <span className="text-zinc-100">{linha.targetPercent.toFixed(1)}%</span>
                            {linha.gapPp !== null && Math.abs(linha.gapPp) >= 0.1 && (
                              <span className={`ml-2 text-[11px] ${linha.gapPp > 0 ? "text-amber-300" : "text-indigo-300"}`}>
                                {linha.gapPp > 0 ? "+" : ""}
                                {linha.gapPp.toFixed(1)}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-zinc-600">
            O número menor ao lado da meta é a distância de hoje até ela, em pontos percentuais.
          </p>
        </div>
      )}

      <details className="border-t border-zinc-800 pt-3">
        <summary className="cursor-pointer text-xs font-medium text-indigo-300">Definir metas de um horizonte</summary>
        <form action={salvarMetasDaRegua} className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-zinc-400">
            Horizonte
            <select name="horizonMonths" defaultValue="" className={`${INPUT} w-40`}>
              <option value="">Hoje (sem prazo)</option>
              <option value="12">Em 12 meses</option>
              <option value="24">Em 24 meses</option>
            </select>
          </label>

          <div className="flex flex-col gap-2">
            {MACRO_BLOCOS.map((mb) => (
              <div key={mb} className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-40">{MACRO_BLOCO_LABELS[mb]}</span>
                <input
                  name={`meta_${mb}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="%"
                  className={INPUT}
                />
              </div>
            ))}
          </div>

          <p className="text-[11px] text-zinc-600">
            As quatro fatias precisam fechar em 100% — são partes da mesma renda. Salvar substitui as metas daquele
            horizonte; os demais horizontes não são tocados.
          </p>
          <button type="submit" className={`${BTN_PRIMARY} self-start`}>
            Salvar metas
          </button>
        </form>
      </details>
    </section>
  );
}
