import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL } from "@/lib/format";
import { observeIncomeByPerson, incomeConcentrationHHI } from "@/lib/method/mcrf/income-observation";
import { OBSERVATION_MONTHS_PREFERRED } from "@/lib/method/mcrf/config";
import { PersonRiskCard, type PersonRiskView } from "./PersonRiskCard";

const REGIME_LABELS: Record<string, string> = {
  SERVIDOR_EFETIVO: "Servidor público efetivo",
  MILITAR: "Militar",
  EMPREGADO_PUBLICO: "Empregado público",
  CLT: "CLT",
  CARGO_COMISSIONADO: "Cargo comissionado",
  TEMPORARIO: "Temporário",
  PROFISSIONAL_LIBERAL: "Profissional liberal",
  AUTONOMO: "Autônomo",
  EMPRESARIO: "Empresário",
  MEI: "MEI",
  INFORMAL: "Informal",
  APOSENTADO: "Aposentado",
  PENSIONISTA: "Pensionista",
  DESEMPREGADO: "Desempregado",
  OUTRO: "Outro",
};

const NIVEL_LABELS: Record<string, string> = {
  RENDA_SECUNDARIA_ATIVA: "Já gera renda hoje",
  RENDA_SECUNDARIA_ADORMECIDA: "Gerou renda recentemente",
  CAPACIDADE_POTENCIAL: "Tenho formação, pouca prática",
  POSSIBILIDADE_TEORICA: "Só uma possibilidade",
};

const KIND_LABELS: Record<string, string> = {
  SALARIO: "Salário",
  PRO_LABORE: "Pró-labore",
  AUTONOMO: "Autônomo",
  ALUGUEL: "Aluguel",
  APOSENTADORIA: "Aposentadoria",
  PENSAO: "Pensão",
  BENEFICIO: "Benefício",
  RENDA_PASSIVA: "Renda passiva",
  BICO: "Bico",
  OUTRO: "Outro",
};

const CONFIANCA_LABELS: Record<string, string> = {
  MUITO_ALTA: "muito alta",
  ALTA: "alta",
  MODERADA: "moderada",
  BAIXA: "baixa",
};

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Etapa 9-A.1 do Método (PROSPECTA-MCRF §14/§19/§21) — perfil de risco da
 * unidade financeira. É a coleta que alimenta o motor; nenhum cálculo de
 * reserva acontece aqui ainda (isso é 9-A.3/9-A.4).
 *
 * Regra de UX de §6 aplicada literalmente: a renda **não é perguntada**. Ela é
 * medida no extrato que o sistema já tem (`observeIncomeByPerson`) e exibida
 * como "renda observada". O formulário só pede o que o extrato não revela —
 * vínculo, empregador, portabilidade, segunda atividade.
 */
export default async function PerfilDeRiscoPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "reserva_inteligente"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O perfil de risco está disponível a partir do plano Max.</p>
        <p className="mt-2">
          É a base da Reserva de Emergência PROSPECTA: em vez de multiplicar sua despesa por um número fixo de meses,
          o sistema analisa suas fontes de renda, sua família e seus riscos para calcular quanta liquidez você
          realmente precisa.
        </p>
      </div>
    );
  }

  const [people, incomeEntries] = await Promise.all([
    prisma.person.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: { incomeSources: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.entry.findMany({
      where: { workspaceId, nature: "RECEITA" },
      select: { responsibleId: true, amount: true, dueDate: true, statusCode: true, nature: true },
    }),
  ]);

  const today = new Date();
  const observations = observeIncomeByPerson(
    incomeEntries.map((e) => ({
      responsibleId: e.responsibleId,
      amount: e.amount,
      dueDate: e.dueDate,
      status: e.statusCode as Parameters<typeof observeIncomeByPerson>[0][number]["status"],
      nature: e.nature,
    })),
    people.map((p) => p.id),
    today,
    OBSERVATION_MONTHS_PREFERRED,
  );

  const observationById = new Map(observations.map((o) => [o.personId, o]));

  const views: PersonRiskView[] = people.map((p) => {
    const obs = observationById.get(p.id);
    return {
      id: p.id,
      name: p.name,
      isDependent: p.isDependent,
      regimeTrabalho: p.regimeTrabalho ?? "",
      occupation: p.occupation ?? "",
      cargo: p.cargo ?? "",
      setor: p.setor ?? "",
      cboCode: p.cboCode ?? "",
      tenureCurrentMonths: p.tenureCurrentMonths?.toString() ?? "",
      experienceTotalMonths: p.experienceTotalMonths?.toString() ?? "",
      segundaAtividade: p.segundaAtividade ?? "",
      segundaAtividadeNivel: p.segundaAtividadeNivel ?? "",
      rendaObservadaFormatted: formatCurrencyBRL(obs?.median ?? 0),
      mesesObservados: obs?.monthsObserved ?? 0,
      confiancaLabel: CONFIANCA_LABELS[obs?.confidence ?? "BAIXA"],
      incomeSources: p.incomeSources.map((s) => ({
        id: s.id,
        name: s.name,
        kindLabel: KIND_LABELS[s.kind] ?? s.kind,
        employerName: s.employerName,
        isPrincipal: s.isPrincipal,
      })),
    };
  });

  // §17 — concentração como diagnóstico. Nunca entra na conta da reserva:
  // quem ajusta a reserva é a correlação dentro de cada cenário (9-A.4).
  const hhi = incomeConcentrationHHI(observations.map((o) => o.median));
  const provedores = observations.filter((o) => o.median.greaterThan(0)).length;

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Aqui o sistema aprende quem sustenta esta unidade financeira e o quanto essa renda é resistente. Quanto você
        ganha nós já sabemos pelos seus lançamentos — o que precisamos entender é de onde essa renda vem e o que
        aconteceria se ela parasse.
      </p>

      {hhi !== null && (
        <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-4">
          <p className="text-xs text-indigo-300">Concentração da renda</p>
          <p className="font-mono text-xl tabular-nums text-zinc-100">{(hhi * 100).toFixed(0)}%</p>
          <p className="mt-1 text-xs text-zinc-500">
            {provedores === 1
              ? "Toda a renda vem de uma única pessoa."
              : `${provedores} pessoas geram renda nesta unidade.`}{" "}
            Quanto mais concentrada, mais a família depende de uma coisa só dar certo.
          </p>
          <p className="mt-1 text-[11px] text-zinc-600">
            Indicador de diagnóstico — ele não aumenta sua reserva por si só.
          </p>
        </div>
      )}

      {views.length === 0 ? (
        <p className="text-sm text-indigo-300">
          Nenhum responsável cadastrado ainda. Cadastre em Cadastros → Responsáveis.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {views.map((person) => (
            <PersonRiskCard
              key={person.id}
              person={person}
              regimeOptions={toOptions(REGIME_LABELS)}
              nivelOptions={toOptions(NIVEL_LABELS)}
              kindOptions={toOptions(KIND_LABELS)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
