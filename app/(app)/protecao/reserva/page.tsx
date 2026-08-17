import Link from "next/link";
import { requireWorkspaceId } from "@/lib/auth/session";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/ui/buttonStyles";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { runAssessment } from "@/lib/method/mcrf/run-assessment";
import { buildReservePlan, treatmentPlan } from "@/lib/method/mcrf/plan-engine";
import { deltaCobertura, deltaReserva, parseSimulation, type SimulationParams } from "@/lib/method/mcrf/simulator";
import { Decimal } from "@/lib/finance/types";
import { SaveAssessmentButton } from "./SaveAssessmentButton";

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

const CONFIANCA_LABELS: Record<string, string> = {
  MUITO_ALTA: "Muito alta",
  ALTA: "Alta",
  MODERADA: "Moderada",
  BAIXA: "Baixa",
};

/**
 * Etapa 9-A.5 (PROSPECTA-MCRF §41/§42/§56) — a tela onde o método vira número.
 *
 * §41 manda **não mostrar matemática excessiva** na tela principal: o destaque
 * é o valor e a explicação em linguagem de gente; a decomposição fica em
 * seções secundárias. §42 manda evitar linguagem alarmista no painel de stress
 * — daí "proteção insuficiente" em vez de "você está desprotegido".
 *
 * O mapa de riscos e o plano de tratamento ficam atrás de `mrp_completo`
 * (camada de método, exige consultor ativo) — decisão comercial do usuário em
 * 2026-08-16. Reserva e stress tests são Max; diagnóstico de risco é método.
 */
export default async function ReservaPage({
  searchParams,
}: {
  searchParams: Promise<SimulationParams>;
}) {
  const workspaceId = await requireWorkspaceId();

  const [temReserva, temMapaDeRiscos] = await Promise.all([
    hasFeature(workspaceId, "reserva_inteligente"),
    hasFeature(workspaceId, "mrp_completo"),
  ]);

  if (!temReserva) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">A Reserva de Emergência PROSPECTA está disponível a partir do plano Max.</p>
        <p className="mt-2">
          Em vez de multiplicar sua despesa por um número fixo de meses, ela simula o que aconteceria com as suas
          finanças em cenários adversos e calcula quanta liquidez você precisaria para atravessá-los.
        </p>
      </div>
    );
  }

  const params = await searchParams;
  const sim = parseSimulation(params);

  const [a, historico] = await Promise.all([
    runAssessment(workspaceId),
    prisma.mcrfAssessment.findMany({
      where: { workspaceId },
      orderBy: { calculationDate: "desc" },
      take: 6,
    }),
  ]);

  // §43 — a simulação é uma **segunda** avaliação, não uma substituição: o
  // painel principal continua mostrando o cálculo real, e o simulado aparece ao
  // lado. Isso também é o que mantém "Salvar no histórico" seguro — a ação
  // chama `runAssessment` sem overrides e grava sempre o real, nunca a hipótese.
  //
  // Só roda quando há hipótese válida: sem isso, toda visita à tela pagaria uma
  // segunda leitura completa do banco à toa.
  const simulado = sim.ativo ? await runAssessment(workspaceId, undefined, sim.overrides) : null;

  const semDados = a.cema.lessThanOrEqualTo(0);

  // §44 — plano de construção. A renda é a **mediana observada** nos
  // lançamentos, nunca uma estimativa derivada da despesa. Metade do excedente
  // é o padrão: guardar 100% da folga é insustentável e faria o prazo virar
  // ficção.
  const plano = buildReservePlan({
    target: a.reserveTarget,
    current: a.eligibleReserve,
    rendaMensal: a.rendaMensalObservada,
    custoEssencialMensal: a.cema,
    fracaoDoExcedente: 0.5,
    receitasExtraordinariasAnuais: new Decimal(0),
  });

  // §40 — como reduzir a necessidade de reserva sem ficar menos protegido.
  const tratamento = treatmentPlan({
    temSegundaAtividadeResiliente: !a.mainDrivers.some((d) => d.includes("atividade alternativa")),
    temSeguroContratado: !a.mainDrivers.some((d) => d.includes("sem cobertura contratada")),
    correlacaoRendaAlta: a.mainDrivers.some((d) => d.includes("mesma fonte")),
    rigidezPct: null,
    concentracaoRenda: null,
    semCapacidadeDePoupanca: plano.semCapacidadeDePoupanca,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm text-zinc-500">
          Este valor não é sua despesa multiplicada por um número de meses. Ele vem de simular eventos adversos mês a
          mês — perda de renda, redução parcial, incapacidade, emergências — e medir quanta liquidez você consumiria
          até se recuperar.
        </p>
        <SaveAssessmentButton />
      </div>

      {semDados ? (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-4 text-sm text-amber-200">
          Ainda não há despesas liquidadas suficientes para calcular seu custo essencial. Registre alguns meses de
          lançamentos e volte — o cálculo depende do seu histórico real, não de estimativas.
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6">
            <p className="text-xs text-indigo-300">Sua Reserva Recomendada PROSPECTA</p>
            <p className="mt-1 font-mono text-4xl tabular-nums text-zinc-100">{formatCurrencyBRL(a.reserveTarget)}</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${Math.min(100, a.progressoPct)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Você tem <strong className="text-zinc-200">{formatCurrencyBRL(a.eligibleReserve)}</strong> elegíveis hoje
              — {a.progressoPct.toFixed(0)}% da meta.
              {a.faltaConstruir.greaterThan(0) && <> Faltam {formatCurrencyBRL(a.faltaConstruir)}.</>}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card label="Custo essencial (mês)" value={formatCurrencyBRL(a.cema)} hint="o que sua vida custa hoje" />
            <Card
              label="Custo durante a crise"
              value={formatCurrencyBRL(a.ccm)}
              hint="depois dos cortes razoáveis"
            />
            <Card
              label="Cobertura matemática"
              value={a.coberturaMatematicaMeses !== null ? `${a.coberturaMatematicaMeses.toFixed(1)} meses` : "—"}
              hint="reserva ÷ custo essencial"
            />
            <Card
              label="Cobertura no cenário principal"
              value={a.coberturaNoCenarioMeses !== null ? `${a.coberturaNoCenarioMeses} meses` : "—"}
              hint="considerando a renda que continua"
            />
          </div>

          <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <h2 className="text-sm font-medium text-zinc-200">Por que este valor?</h2>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
              {a.mainDrivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
              {a.mainDrivers.length === 0 && <li>Seu perfil está equilibrado nos fatores analisados.</li>}
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Confiança da análise: <strong className="text-zinc-300">{CONFIANCA_LABELS[a.dataConfidence]}</strong>
              {a.margemAplicada > 0 && <> · margem de segurança de {(a.margemAplicada * 100).toFixed(0)}% aplicada</>}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-zinc-300">Cenários de stress</h2>
            <p className="mb-2 mt-1 max-w-3xl text-xs text-zinc-500">
              Cada linha é um evento simulado mês a mês. &quot;Protegido&quot; significa que sua reserva elegível
              cobriria a necessidade daquele cenário.
            </p>
            <div className="overflow-x-auto rounded-xl border border-indigo-900/50">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="bg-[#131A47] text-xs text-indigo-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Cenário</th>
                    <th className="px-3 py-2 text-right font-medium">Liquidez necessária</th>
                    <th className="px-3 py-2 text-left font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-900/40 bg-[#131A47]/50">
                  {a.scenarios.map((s) => {
                    const cobre = a.eligibleReserve.greaterThanOrEqualTo(s.need);
                    const parcial = !cobre && a.eligibleReserve.greaterThanOrEqualTo(s.need.times(0.6));
                    return (
                      <tr key={s.id} className={s.isMaterial ? "" : "opacity-50"}>
                        <td className="px-3 py-2 text-zinc-200">
                          {s.label}
                          {!s.isMaterial && (
                            <span className="ml-2 text-xs text-zinc-500">· pouco provável no seu caso</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-zinc-300">
                          {formatCurrencyBRL(s.need)}
                        </td>
                        <td
                          className={`px-3 py-2 text-xs ${
                            cobre ? "text-emerald-400" : parcial ? "text-amber-300" : "text-red-400"
                          }`}
                        >
                          {cobre ? "Protegido" : parcial ? "Parcialmente protegido" : "Proteção insuficiente"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {temMapaDeRiscos ? (
            <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
              <h2 className="text-sm font-medium text-zinc-200">Resiliência financeira (IPRF)</h2>
              <p className="mt-1 font-mono text-2xl tabular-nums text-zinc-100">{a.iprf}<span className="text-sm text-zinc-500">/100</span></p>
              <ul className="mt-3 flex flex-col gap-1 text-xs text-zinc-400">
                {a.iprfComponentes.map((c) => (
                  <li key={c.nome} className="flex items-center justify-between gap-3">
                    <span>{c.nome}</span>
                    <span className="font-mono tabular-nums text-zinc-500">
                      {(c.valor * 100).toFixed(0)}% · peso {c.peso}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-500">
              O mapa de riscos completo e o plano de tratamento fazem parte da consultoria — eles dizem como reduzir
              sua necessidade de reserva sem ficar menos protegido.
            </p>
          )}

          <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <h2 className="text-sm font-medium text-zinc-200">Como chegar lá</h2>
            {plano.metaAtingida ? (
              <p className="mt-2 text-sm text-emerald-400">
                Sua reserva já atingiu o nível recomendado. O próximo passo é revisar em alguns meses — a
                recomendação muda quando sua vida muda.
              </p>
            ) : plano.mesesAteMeta === null ? (
              <p className="mt-2 text-sm text-zinc-400">
                Não há folga no orçamento depois do custo essencial, então nenhum prazo seria realista. O caminho
                começa por abrir espaço — as sugestões abaixo são por onde.
              </p>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">
                Guardando <strong className="text-zinc-200">{formatCurrencyBRL(plano.aporteTotalMensal)}</strong> por
                mês, sua reserva chega ao nível recomendado em cerca de{" "}
                <strong className="text-zinc-200">{plano.mesesAteMeta} meses</strong>.
              </p>
            )}

            <h3 className="mt-4 text-xs font-medium text-indigo-300">
              Como reduzir a necessidade de reserva sem ficar menos protegido
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {tratamento.map((t) => (
                <li key={t.acao} className="text-sm">
                  <span className="text-zinc-200">{t.acao}</span>
                  <p className="text-xs text-zinc-500">{t.porque}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-zinc-600">
              Guardar mais dinheiro financia o risco; transferir, diversificar ou reduzir a exposição o diminui na
              origem.
            </p>
          </section>

          {/*
            §43 — o simulador. As hipóteses vão na query string, então uma
            simulação é um link: dá para mandar "veja o que acontece se você
            quitar esta dívida" sem tocar em nada da conta do cliente.
          */}
          <section id="simulador" className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
            <h2 className="text-sm font-medium text-zinc-200">E se…?</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Teste uma mudança na sua vida e veja o efeito na reserva recomendada. Preencha só o que quiser testar —
              o que ficar em branco continua como está hoje. <strong className="text-zinc-400">Nada é salvo</strong>:
              isto não altera seus dados nem o seu histórico.
            </p>

            <form method="GET" className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className={LABEL}>
                  Meu custo mensal cai (%)
                  <input
                    name="custoPct"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="ex.: 10"
                    defaultValue={params.custoPct ?? ""}
                    className={INPUT}
                  />
                </label>
                <label className={LABEL}>
                  Entra renda extra por mês (R$)
                  <input
                    name="rendaExtra"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="ex.: 2000"
                    defaultValue={params.rendaExtra ?? ""}
                    className={INPUT}
                  />
                </label>
                <label className={LABEL}>
                  Quito uma dívida de (R$/mês)
                  <input
                    name="dividaQuitada"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="ex.: 800"
                    defaultValue={params.dividaQuitada ?? ""}
                    className={INPUT}
                  />
                </label>
                <label className={LABEL}>
                  Acrescento liquidez de (R$)
                  <input
                    name="liquidezExtra"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="ex.: 10000"
                    defaultValue={params.liquidezExtra ?? ""}
                    className={INPUT}
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    name="segundaAtividade"
                    type="checkbox"
                    value="1"
                    defaultChecked={params.segundaAtividade === "1"}
                    className="accent-amber-500"
                  />
                  Minha atividade alternativa passa a gerar renda de verdade
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input
                    name="seguroRenda"
                    type="checkbox"
                    value="1"
                    defaultChecked={params.seguroRenda === "1"}
                    className="accent-amber-500"
                  />
                  Contrato proteção para o risco principal
                </label>
              </div>

              <div className="flex items-center gap-3">
                <button type="submit" className={BTN_PRIMARY}>
                  Simular
                </button>
                {sim.ativo && (
                  <Link href="/protecao/reserva" className={BTN_GHOST}>
                    Limpar simulação
                  </Link>
                )}
              </div>
            </form>

            {sim.ignorados.length > 0 && (
              <ul className="mt-4 flex list-disc flex-col gap-1 rounded-lg border border-amber-900/50 bg-amber-950/10 p-3 pl-7 text-xs text-amber-200">
                {sim.ignorados.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}

            {simulado && (
              <div className="mt-5 border-t border-indigo-900/50 pt-4">
                <h3 className="text-xs font-medium text-indigo-300">Nesse cenário</h3>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
                  {sim.hipoteses.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                        <th className="px-3 py-2 text-left font-medium">&nbsp;</th>
                        <th className="px-3 py-2 text-right font-medium">Hoje</th>
                        <th className="px-3 py-2 text-right font-medium">Simulado</th>
                        <th className="px-3 py-2 text-right font-medium">Diferença</th>
                      </tr>
                    </thead>
                    <tbody>
                      <LinhaDinheiro
                        rotulo="Reserva recomendada"
                        real={a.reserveTarget}
                        simulado={simulado.reserveTarget}
                      />
                      <LinhaDinheiro
                        rotulo="Falta construir"
                        real={a.faltaConstruir}
                        simulado={simulado.faltaConstruir}
                      />
                      <LinhaDinheiro
                        rotulo="Custo essencial (mês)"
                        real={a.cema}
                        simulado={simulado.cema}
                      />
                      <LinhaMeses
                        rotulo="Cobertura no cenário principal"
                        real={a.coberturaNoCenarioMeses}
                        simulado={simulado.coberturaNoCenarioMeses}
                      />
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-[11px] text-zinc-600">
                  Precisar de <strong className="text-zinc-500">menos</strong> reserva é melhora: é o mesmo grau de
                  proteção com menos dinheiro parado. O cálculo real, acima nesta tela, não mudou.
                </p>
              </div>
            )}
          </section>

          {a.aprendizadoDeChoques.length > 0 && (
            <section className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
              <h2 className="text-sm font-medium text-zinc-200">O que sua própria história ensinou</h2>
              <p className="mb-2 mt-1 text-xs text-zinc-500">
                Cenário simulado é hipótese; o que já aconteceu com você é fato — e fato pesa mais no cálculo.
              </p>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
                {a.aprendizadoDeChoques.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </section>
          )}

          {a.gaps.length > 0 && (
            <section className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-4">
              <h2 className="text-sm font-medium text-amber-200">O que deixaria este cálculo mais preciso</h2>
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-zinc-400">
                {a.gaps.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {historico.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Histórico</h2>
          <ul className="flex flex-col gap-1 text-xs text-zinc-500">
            {historico.map((h) => (
              <li key={h.id}>
                {formatDateBR(h.calculationDate)} — meta {formatCurrencyBRL(h.reserveTarget)}, reserva{" "}
                {formatCurrencyBRL(h.eligibleReserve)}{" "}
                <span className="text-zinc-600">({h.methodologyVersion})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
      <p className="text-xs text-indigo-300">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-zinc-100">{value}</p>
      <p className="mt-1 text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}

/** Neutro quando não muda: pintar de verde uma diferença de zero seria mentir por cor. */
function corDaDiferenca(melhor: boolean, igual: boolean) {
  if (igual) return "text-zinc-500";
  return melhor ? "text-emerald-400" : "text-amber-300";
}

function LinhaDinheiro({ rotulo, real, simulado }: { rotulo: string; real: Decimal; simulado: Decimal }) {
  const d = deltaReserva(real, simulado);
  const sinal = d.diferenca.isNegative() ? "" : "+";
  return (
    <tr className="border-b border-zinc-800/60">
      <td className="px-3 py-2 text-zinc-300">{rotulo}</td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-400">{formatCurrencyBRL(real)}</td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">{formatCurrencyBRL(simulado)}</td>
      <td className={`px-3 py-2 text-right font-mono tabular-nums ${corDaDiferenca(d.melhor, d.igual)}`}>
        {d.igual ? "—" : `${sinal}${formatCurrencyBRL(d.diferenca)}`}
      </td>
    </tr>
  );
}

function LinhaMeses({
  rotulo,
  real,
  simulado,
}: {
  rotulo: string;
  real: number | null;
  simulado: number | null;
}) {
  // Sem cenário material não há cobertura a comparar — e inventar zero aqui
  // sugeriria desproteção onde só há ausência de cenário.
  const comparavel = real !== null && simulado !== null;
  const d = comparavel ? deltaCobertura(real, simulado) : null;
  const sinal = d && d.diferenca.isNegative() ? "" : "+";
  return (
    <tr className="border-b border-zinc-800/60">
      <td className="px-3 py-2 text-zinc-300">{rotulo}</td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-400">{real === null ? "—" : `${real} m`}</td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">
        {simulado === null ? "—" : `${simulado} m`}
      </td>
      <td className={`px-3 py-2 text-right font-mono tabular-nums ${d ? corDaDiferenca(d.melhor, d.igual) : "text-zinc-500"}`}>
        {!d || d.igual ? "—" : `${sinal}${d.diferenca.toFixed(0)} m`}
      </td>
    </tr>
  );
}
