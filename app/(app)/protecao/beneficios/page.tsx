import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL } from "@/lib/format";
import { benefitAppliesTo } from "@/lib/method/mcrf/benefits-engine";
import type { BenefitKind } from "@/app/generated/prisma/enums";
import { PersonBenefitsCard, type PersonBenefitsView } from "./BenefitControls";

const KIND_LABELS: Record<BenefitKind, string> = {
  FGTS: "FGTS",
  SEGURO_DESEMPREGO: "Seguro-desemprego",
  VERBAS_RESCISORIAS: "Verbas rescisórias",
  AUXILIO_DOENCA: "Auxílio-doença",
  APOSENTADORIA_INVALIDEZ: "Aposentadoria por invalidez",
  PENSAO_MORTE: "Pensão por morte",
  LICENCA_ESTATUTARIA: "Licença estatutária",
  BENEFICIO_EMPREGADOR: "Benefício do empregador",
  OUTRO: "Outra proteção",
};

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

const ALL_KINDS = Object.keys(KIND_LABELS) as BenefitKind[];

/**
 * Etapa 9-A.2 (PROSPECTA-MCRF §25) — proteções trabalhistas e previdenciárias.
 *
 * A tela filtra as opções pelo regime de cada pessoa (§23): militar e servidor
 * não têm FGTS, seguro-desemprego nem verbas rescisórias. Em vez de só esconder,
 * ela **explica** o que ficou de fora — o cliente precisa entender que a rede de
 * proteção dele é diferente, não menor por engano do sistema.
 */
export default async function BeneficiosPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "reserva_inteligente"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O cadastro de proteções está disponível a partir do plano Max.</p>
        <p className="mt-2">
          FGTS, seguro-desemprego, auxílio-doença e licenças mudam completamente o tamanho da reserva necessária — e
          mudam conforme o seu regime de trabalho.
        </p>
      </div>
    );
  }

  const people = await prisma.person.findMany({
    where: { workspaceId, isDependent: false },
    orderBy: { name: "asc" },
    include: { benefitEntitlements: { orderBy: { createdAt: "asc" } } },
  });

  const views: PersonBenefitsView[] = people.map((p) => {
    const aplicaveis = ALL_KINDS.filter((k) => benefitAppliesTo(k, p.regimeTrabalho));
    const excluidos = ALL_KINDS.filter((k) => !benefitAppliesTo(k, p.regimeTrabalho)).map((k) => KIND_LABELS[k]);

    return {
      id: p.id,
      name: p.name,
      regimeLabel: p.regimeTrabalho ? REGIME_LABELS[p.regimeTrabalho] : null,
      kindOptions: aplicaveis.map((k) => ({ value: k, label: KIND_LABELS[k] })),
      excluidos,
      benefits: p.benefitEntitlements.map((b) => ({
        id: b.id,
        kindLabel: KIND_LABELS[b.kind] ?? b.kind,
        elegibilidadeLabel:
          b.isEligible === true ? "confirmado" : b.isEligible === false ? "não tenho" : "a confirmar",
        amountFormatted: b.estimatedAmount ? formatCurrencyBRL(b.estimatedAmount) : null,
        durationMonths: b.durationMonths,
        availableAfterDays: b.availableAfterDays,
      })),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Se a renda parar, o que ainda entra? FGTS, seguro-desemprego, auxílio-doença, licença — cada um com seu valor,
        sua duração e, principalmente, o tempo até cair na conta. Um recurso que só chega em 60 dias não ajuda a pagar
        a conta que vence semana que vem, e o cálculo respeita isso.
      </p>

      {views.length === 0 ? (
        <p className="text-sm text-indigo-300">
          Nenhuma pessoa provedora cadastrada. Cadastre em Cadastros → Responsáveis e preencha o regime em Perfil de
          Risco.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {views.map((person) => (
            <PersonBenefitsCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
