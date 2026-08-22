import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL } from "@/lib/format";
import { Decimal } from "@/lib/finance/types";
import { buildPolicyMap, foraDaFaixa, semPolitica, validatePolicy, type Position } from "@/lib/method/pip";
import { BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { salvarPolitica } from "./pip-actions";

const INPUT =
  "w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-indigo-500";

/**
 * Etapa 14 (§12.1) — Política de Investimento Pessoal, sobre a Análise que já
 * existia.
 *
 * Fica **dentro** da Análise, e não em tela própria, porque a política só faz
 * sentido ao lado da carteira que ela governa: separar obrigaria o consultor a
 * comparar dois números em duas telas.
 *
 * Gateada por `pip_politica`. Quem não tem, não vê a seção — sem mensagem de
 * "contrate": a Análise é uma tela de plano, e enchê-la de anúncio atrapalharia
 * quem só quer ver a carteira.
 */
export async function PipSection({ workspaceId, positions }: { workspaceId: string; positions: Position[] }) {
  if (!(await hasFeature(workspaceId, "pip_politica"))) return null;

  const [targets, classes] = await Promise.all([
    prisma.investmentPolicyTarget.findMany({ where: { workspaceId }, include: { class: true } }),
    prisma.investmentClass.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const bands = targets.map((t) => ({
    classCode: t.classCode,
    classLabel: t.class.labelPt,
    minPercent: t.minPercent,
    maxPercent: t.maxPercent,
  }));

  const rows = buildPolicyMap(positions, bands);
  const desalinhadas = foraDaFaixa(rows);
  const foraDaPolitica = semPolitica(rows);
  const validacao = validatePolicy(bands);
  const bandByClass = new Map(targets.map((t) => [t.classCode, t]));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <div>
        <h2 className="text-sm font-medium text-zinc-200">Política de Investimento (PIP)</h2>
        <p className="mt-1 max-w-3xl text-xs text-zinc-500">
          A política define em que <strong className="text-zinc-400">faixa</strong> cada classe deve ficar — não um
          alvo exato. É a faixa que torna a regra operável: alvo exato exigiria rebalancear a cada oscilação, com
          custo e imposto a cada tremor de mercado. Só se mexe quando a posição sai da banda.
        </p>
      </div>

      {bands.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nenhuma faixa definida ainda. Preencha abaixo para a política passar a medir o desvio da carteira.
        </p>
      ) : (
        <>
          {validacao.avisos.map((a) => (
            <p key={a} className="rounded-lg border border-amber-900/50 bg-amber-950/10 p-2 text-xs text-amber-200">
              {a}
            </p>
          ))}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-3 py-2 text-left font-medium">Classe</th>
                  <th className="px-3 py-2 text-right font-medium">Hoje</th>
                  <th className="px-3 py-2 text-center font-medium">Faixa</th>
                  <th className="px-3 py-2 text-left font-medium">Situação</th>
                  <th className="px-3 py-2 text-right font-medium">Ajuste</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.classCode} className="border-b border-zinc-800/60">
                    <td className="px-3 py-2 text-zinc-200">{r.classLabel}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-300">
                      {r.actualPercent.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-center font-mono tabular-nums text-zinc-500">
                      {r.band ? `${r.band.minPercent.toFixed(0)}–${r.band.maxPercent.toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {r.status === null ? (
                        <span className="text-zinc-500">fora da política</span>
                      ) : r.status === "DENTRO" ? (
                        <span className="text-emerald-400">dentro</span>
                      ) : (
                        <span className="text-amber-300">
                          {r.status === "ACIMA" ? "acima" : "abaixo"} em {r.desvioPp.toFixed(1)} p.p.
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">
                      {r.ajusteValor.isZero() ? "—" : formatCurrencyBRL(r.ajusteValor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {desalinhadas.length === 0 && foraDaPolitica.length === 0 && (
            <p className="text-xs text-emerald-400">A carteira está dentro da política em todas as classes.</p>
          )}

          {foraDaPolitica.length > 0 && (
            <p className="text-xs text-zinc-500">
              Há {formatCurrencyBRL(foraDaPolitica.reduce((s, r) => s.plus(r.currentValue), new Decimal(0)))} em
              classes que a política não prevê. Definir uma faixa para elas — ou decidir que não devem existir — é
              parte da conversa.
            </p>
          )}

          <p className="text-[11px] text-zinc-600">
            A coluna Ajuste diz quanto precisaria entrar ou sair para voltar à borda da faixa. A PROSPECTA mede o
            desvio; escolher o que comprar ou vender é conversa com um profissional licenciado.
          </p>
        </>
      )}

      <details className="border-t border-zinc-800 pt-3">
        <summary className="cursor-pointer text-xs font-medium text-indigo-300">
          {bands.length === 0 ? "Definir as faixas" : "Editar as faixas"}
        </summary>
        <form action={salvarPolitica} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {classes.map((c) => {
              const t = bandByClass.get(c.code);
              return (
                <div key={c.code} className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="w-56 truncate">{c.labelPt}</span>
                  <input
                    name={`min_${c.code}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="mín %"
                    defaultValue={t ? t.minPercent.toFixed(1) : ""}
                    className={INPUT}
                  />
                  <span className="text-zinc-600">a</span>
                  <input
                    name={`max_${c.code}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="máx %"
                    defaultValue={t ? t.maxPercent.toFixed(1) : ""}
                    className={INPUT}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-zinc-600">
            Classe deixada em branco não entra na política — diferente de definir 0 a 0, que a proibiria. Os mínimos
            não podem somar mais de 100%, nem os máximos menos de 100%: seria política impossível de cumprir.
          </p>
          <button type="submit" className={`${BTN_PRIMARY} self-start`}>
            Salvar política
          </button>
        </form>
      </details>
    </section>
  );
}
