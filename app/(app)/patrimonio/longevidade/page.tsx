import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { Decimal } from "@/lib/finance/types";
import { IDADE_FINAL_PADRAO, TAXA_REAL_PADRAO, projectAll } from "@/lib/method/retirement";
import { GateAviso } from "@/components/method/GateAviso";
import { BTN_PRIMARY, BTN_SECONDARY } from "@/components/ui/buttonStyles";
import { salvarProjecao } from "./actions";

const INPUT =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-indigo-500";
const LABEL = "flex flex-col gap-1 text-xs text-zinc-400";

const CENARIO_LABELS: Record<string, string> = {
  conservador: "Conservador",
  base: "Base",
  otimista: "Otimista",
};

interface Params {
  idadeAtual?: string;
  idadeAlvo?: string;
  idadeFinal?: string;
  rendaDesejadaMensal?: string;
  rendaJaExistenteMensal?: string;
  capitalAtual?: string;
  aporteMensalAtual?: string;
  taxaConservador?: string;
  taxaBase?: string;
  taxaOtimista?: string;
}

function n(raw: string | undefined, fallback: number): number {
  const v = Number(String(raw ?? "").replace(",", "."));
  return Number.isFinite(v) && String(raw ?? "").trim() !== "" ? v : fallback;
}

/**
 * Etapa 13 (§5) — Plano de Longevidade e Aposentadoria (PLA).
 *
 * **Tudo em poder de compra de hoje.** O motor trabalha com taxa **real**, e
 * essa é a decisão que mais afeta a leitura: um capital necessário de R$ 2
 * milhões aqui significa dois milhões de hoje, não um número inflacionado que o
 * cliente não sabe interpretar.
 *
 * Os parâmetros trafegam na query string, como no simulador da Reserva — assim
 * a tela recalcula ao vivo sem gravar nada. Gravar é ato explícito, e produz uma
 * **versão** do PLA com os três cenários juntos.
 */
export default async function LongevidadePage({ searchParams }: { searchParams: Promise<Params> }) {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "pla_projecao"))) {
    return (
      <GateAviso
        workspaceId={workspaceId}
        titulo="O Plano de Longevidade e Aposentadoria faz parte da consultoria."
        explicacao="Ele projeta quanto capital você precisaria ter para sustentar a renda que deseja, em três cenários de retorno, e quanto isso exige de aporte por mês."
      />
    );
  }

  const p = await searchParams;
  const idadeAtual = n(p.idadeAtual, 40);
  const idadeAlvo = n(p.idadeAlvo, 65);
  const idadeFinal = n(p.idadeFinal, IDADE_FINAL_PADRAO);
  const taxas = {
    conservador: n(p.taxaConservador, TAXA_REAL_PADRAO.conservador * 100) / 100,
    base: n(p.taxaBase, TAXA_REAL_PADRAO.base * 100) / 100,
    otimista: n(p.taxaOtimista, TAXA_REAL_PADRAO.otimista * 100) / 100,
  };

  const input = {
    idadeAtual,
    idadeAlvo,
    rendaDesejadaMensal: new Decimal(n(p.rendaDesejadaMensal, 0)),
    capitalAtual: new Decimal(n(p.capitalAtual, 0)),
    aporteMensalAtual: new Decimal(n(p.aporteMensalAtual, 0)),
  };

  const resultados = projectAll(
    input,
    { idadeFinal, rendaJaExistenteMensal: String(n(p.rendaJaExistenteMensal, 0)) },
    taxas,
  );

  const engagement = await activeEngagement(workspaceId);
  const versoes = engagement
    ? await prisma.retirementProjection.findMany({
        where: { engagementId: engagement.id },
        orderBy: [{ version: "desc" }, { scenario: "asc" }],
        take: 12,
      })
    : [];

  const alertas = [...new Set(resultados.flatMap((r) => r.alertas))];
  const temRenda = input.rendaDesejadaMensal.greaterThan(0);

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Quanto capital precisa existir para sustentar a renda que você quer, e quanto isso pede de aporte por mês.
        Três cenários, porque a resposta depende de uma premissa que ninguém conhece — o retorno real dos próximos
        anos —, e mostrar um número só esconderia isso.{" "}
        <strong className="text-zinc-400">Todos os valores estão em poder de compra de hoje.</strong>
      </p>

      <form method="GET" className="flex flex-col gap-4 rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className={LABEL}>
            Sua idade hoje
            <input name="idadeAtual" type="number" min="18" max="100" defaultValue={idadeAtual} className={INPUT} />
          </label>
          <label className={LABEL}>
            Idade em que quer parar
            <input name="idadeAlvo" type="number" min="30" max="100" defaultValue={idadeAlvo} className={INPUT} />
          </label>
          <label className={LABEL}>
            Renda desejada por mês (R$)
            <input
              name="rendaDesejadaMensal"
              type="number"
              min="0"
              step="0.01"
              defaultValue={p.rendaDesejadaMensal ?? ""}
              placeholder="ex.: 10000"
              className={INPUT}
            />
          </label>
          <label className={LABEL}>
            Renda que já existirá (R$/mês)
            <input
              name="rendaJaExistenteMensal"
              type="number"
              min="0"
              step="0.01"
              defaultValue={p.rendaJaExistenteMensal ?? ""}
              className={INPUT}
            />
            <span className="text-[11px] text-zinc-600">INSS, previdência, aluguel — o que não precisa vir do capital.</span>
          </label>
          <label className={LABEL}>
            Já acumulado para isso (R$)
            <input
              name="capitalAtual"
              type="number"
              min="0"
              step="0.01"
              defaultValue={p.capitalAtual ?? ""}
              className={INPUT}
            />
          </label>
          <label className={LABEL}>
            Aporte de hoje (R$/mês)
            <input
              name="aporteMensalAtual"
              type="number"
              min="0"
              step="0.01"
              defaultValue={p.aporteMensalAtual ?? ""}
              className={INPUT}
            />
          </label>
          <label className={LABEL}>
            O dinheiro precisa durar até
            <input name="idadeFinal" type="number" min="60" max="110" defaultValue={idadeFinal} className={INPUT} />
            <span className="text-[11px] text-zinc-600">Bem acima da média de propósito — o risco é viver mais que o dinheiro.</span>
          </label>
        </div>

        <details className="text-xs text-zinc-500">
          <summary className="cursor-pointer">Premissas de retorno real (% ao ano, acima da inflação)</summary>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className={LABEL}>
              Conservador
              <input name="taxaConservador" type="number" step="0.1" defaultValue={(taxas.conservador * 100).toFixed(1)} className={INPUT} />
            </label>
            <label className={LABEL}>
              Base
              <input name="taxaBase" type="number" step="0.1" defaultValue={(taxas.base * 100).toFixed(1)} className={INPUT} />
            </label>
            <label className={LABEL}>
              Otimista
              <input name="taxaOtimista" type="number" step="0.1" defaultValue={(taxas.otimista * 100).toFixed(1)} className={INPUT} />
            </label>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Estes três números não vêm da Metodologia — são ponto de partida, e o consultor ajusta. Cada versão
            salva guarda a premissa que a produziu.
          </p>
        </details>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={BTN_SECONDARY}>
            Recalcular
          </button>
          {temRenda && engagement && (
            <button formAction={salvarProjecao} className={BTN_PRIMARY}>
              Salvar como versão do PLA
            </button>
          )}
        </div>
      </form>

      {alertas.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 rounded-xl border border-amber-900/50 bg-amber-950/10 p-4 pl-8 text-sm text-amber-200">
          {alertas.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}

      {!temRenda ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-500">
          Informe a renda mensal desejada para ver a projeção.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {resultados.map((r) => (
            <div key={r.scenario} className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
              <p className="text-xs text-indigo-300">
                {CENARIO_LABELS[r.scenario]} · {(r.assumptions.taxaRealAnual * 100).toFixed(1)}% real a.a.
              </p>

              <p className="mt-3 text-[11px] text-zinc-500">Capital necessário aos {idadeAlvo}</p>
              <p className="font-mono text-2xl tabular-nums text-zinc-100">{formatCurrencyBRL(r.requiredCapital)}</p>

              <p className="mt-3 text-[11px] text-zinc-500">Aporte necessário por mês</p>
              <p className="font-mono text-lg tabular-nums text-amber-300">
                {formatCurrencyBRL(r.requiredMonthlyContribution)}
              </p>

              <div className="mt-4 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                <p>
                  Cobre {formatCurrencyBRL(r.rendaACobrirMensal)}/mês por {r.anosDeRenda} anos, a partir de{" "}
                  {r.anosAteAlvo} anos de acumulação.
                </p>
                <p className="mt-2">
                  Seu aporte de hoje cobre{" "}
                  <strong className={r.suficienciaPct >= 100 ? "text-emerald-400" : "text-zinc-300"}>
                    {r.suficienciaPct.toFixed(0)}%
                  </strong>{" "}
                  do necessário.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="max-w-3xl text-xs text-zinc-600">
        Projeção é hipótese, não promessa: ela diz o que aconteceria <em>se</em> as premissas se confirmarem. Por isso
        são três, e por isso cada versão salva registra a premissa que a produziu. A PROSPECTA não indica onde
        investir — isso é conversa com um profissional licenciado.
      </p>

      {versoes.length > 0 && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-300">Versões salvas</h2>
          <ul className="flex flex-col gap-1 text-xs text-zinc-500">
            {versoes.map((v) => (
              <li key={v.id}>
                v{v.version} · {CENARIO_LABELS[v.scenario] ?? v.scenario} · capital{" "}
                {formatCurrencyBRL(v.requiredCapital)} · aporte {formatCurrencyBRL(v.requiredMonthlyContribution)}{" "}
                <span className="text-zinc-600">({formatDateBR(v.createdAt)})</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-zinc-600">
            Versão nova nunca sobrescreve a anterior — é o que permite mostrar ao cliente o que mudou desde a última
            conversa, e por quê.
          </p>
        </section>
      )}
    </div>
  );
}
