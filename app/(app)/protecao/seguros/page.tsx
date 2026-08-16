import { requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { formatCurrencyBRL } from "@/lib/format";
import { NewPolicyForm, PolicyCard, type PolicyView } from "./InsuranceControls";

const KIND_LABELS: Record<string, string> = {
  VIDA: "Vida",
  INCAPACIDADE: "Incapacidade",
  PROTECAO_RENDA: "Proteção de renda",
  SAUDE: "Saúde",
  ODONTOLOGICO: "Odontológico",
  AUTOMOVEL: "Automóvel",
  RESIDENCIAL: "Residencial",
  PRESTAMISTA: "Prestamista",
  EMPRESARIAL: "Empresarial",
  OUTRO: "Outro",
};

/**
 * Etapa 9-A.2 (PROSPECTA-MCRF §26) — cadastro de seguros. O que o motor de
 * risco consome não é a apólice, é a **cobertura**: franquia, carência e prazo
 * de indenização decidem se uma proteção reduz ou não a necessidade de caixa.
 * Por isso a tela insiste na cobertura e avisa quando a apólice está sem nenhuma.
 */
export default async function SegurosPage() {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "seguros_cadastro"))) {
    return (
      <div className="rounded-xl border border-indigo-900/50 bg-[#131A47] p-6 text-sm text-zinc-400">
        <p className="text-zinc-200">O cadastro de seguros está disponível a partir do plano Max.</p>
        <p className="mt-2">
          Seguro e reserva resolvem problemas diferentes: o seguro transfere o risco grande, a reserva cobre o que
          sobra — franquia, carência e o tempo até a indenização cair.
        </p>
      </div>
    );
  }

  const [policies, people] = await Promise.all([
    prisma.insurancePolicy.findMany({
      where: { workspaceId, isActive: true },
      include: { coverages: true, person: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.person.findMany({ where: { workspaceId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const views: PolicyView[] = policies.map((p) => ({
    id: p.id,
    name: p.name,
    kindLabel: KIND_LABELS[p.kind] ?? p.kind,
    insurerName: p.insurerName,
    personName: p.person?.name ?? null,
    premiumFormatted: p.premiumMonthly ? formatCurrencyBRL(p.premiumMonthly) : null,
    coverages: p.coverages.map((c) => ({
      id: c.id,
      riskCovered: c.riskCovered,
      capitalFormatted: c.capitalInsured ? formatCurrencyBRL(c.capitalInsured) : null,
      deductibleFormatted: c.deductible ? formatCurrencyBRL(c.deductible) : null,
      waitingPeriodDays: c.waitingPeriodDays,
      payoutDelayDays: c.payoutDelayDays,
    })),
  }));

  const semCobertura = views.filter((v) => v.coverages.length === 0).length;

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm text-zinc-500">
        Seguro e reserva de emergência não competem — se completam. O seguro transfere o risco grande; a reserva cobre
        o que ele deixa de fora: a franquia, o que passa do limite, o período de carência e o tempo até o dinheiro
        cair na conta. Ter apólice não reduz sua reserva sozinho; o que reduz é o que ela de fato paga, e quando.
      </p>

      <NewPolicyForm
        kindOptions={Object.entries(KIND_LABELS).map(([value, label]) => ({ value, label }))}
        personOptions={people.map((p) => ({ value: p.id, label: p.name }))}
      />

      {semCobertura > 0 && (
        <p className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-3 text-xs text-amber-200">
          {semCobertura} apólice(s) sem nenhuma cobertura cadastrada. Enquanto estiverem assim, elas não entram no
          cálculo da sua reserva.
        </p>
      )}

      {views.length === 0 ? (
        <p className="text-sm text-indigo-300">Nenhuma apólice cadastrada ainda.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {views.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
}
