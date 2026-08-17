import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { runAssessment } from "@/lib/method/mcrf/run-assessment";
import { buildReservePlan, treatmentPlan } from "@/lib/method/mcrf/plan-engine";
import { Decimal } from "@/lib/finance/types";
import { SaveAssessmentButton } from "./SaveAssessmentButton";

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
export default async function ReservaPage() {
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

  const [a, historico] = await Promise.all([
    runAssessment(workspaceId),
    prisma.mcrfAssessment.findMany({
      where: { workspaceId },
      orderBy: { calculationDate: "desc" },
      take: 6,
    }),
  ]);

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
