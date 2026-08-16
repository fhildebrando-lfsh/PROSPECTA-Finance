"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { benefitAppliesTo } from "@/lib/method/mcrf/benefits-engine";
import type { BenefitKind } from "@/app/generated/prisma/enums";

const KINDS: BenefitKind[] = [
  "FGTS",
  "SEGURO_DESEMPREGO",
  "VERBAS_RESCISORIAS",
  "AUXILIO_DOENCA",
  "APOSENTADORIA_INVALIDEZ",
  "PENSAO_MORTE",
  "LICENCA_ESTATUTARIA",
  "BENEFICIO_EMPREGADOR",
  "OUTRO",
];

async function guard() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);
  if (!(await hasFeature(workspaceId, "reserva_inteligente"))) {
    throw new Error("O cadastro de proteções está disponível a partir do plano Max.");
  }
  return workspaceId;
}

export async function createBenefit(formData: FormData) {
  const workspaceId = await guard();

  const personId = String(formData.get("personId") ?? "");
  const kind = String(formData.get("kind") ?? "") as BenefitKind;
  if (!personId) throw new Error("Informe a pessoa.");
  if (!KINDS.includes(kind)) throw new Error("Tipo de proteção inválido.");

  const person = await prisma.person.findFirst({ where: { id: personId, workspaceId } });
  if (!person) throw new Error("Pessoa não encontrada neste workspace.");

  // §23 — barra no servidor, não só na tela: um militar não tem FGTS nem
  // seguro-desemprego, e deixar cadastrar daria uma proteção inexistente ao
  // stress test. O motor também filtra, mas errado no banco é errado de origem.
  if (!benefitAppliesTo(kind, person.regimeTrabalho)) {
    throw new Error(
      `Esta proteção não se aplica ao regime de trabalho de ${person.name}. Confira o regime em Perfil de Risco.`,
    );
  }

  const rawEligible = String(formData.get("isEligible") ?? "");
  const isEligible = rawEligible === "sim" ? true : rawEligible === "nao" ? false : null;

  const optionalDecimal = (field: string): string | undefined => {
    const v = String(formData.get(field) ?? "").trim();
    if (v === "") return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new Error("Valor informado inválido.");
    return n.toFixed(2);
  };
  const optionalInt = (field: string): number | null => {
    const v = String(formData.get(field) ?? "").trim();
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new Error("Prazo informado inválido.");
    return Math.round(n);
  };

  await prisma.benefitEntitlement.create({
    data: {
      workspaceId,
      personId: person.id,
      kind,
      isEligible,
      estimatedAmount: optionalDecimal("estimatedAmount"),
      durationMonths: optionalInt("durationMonths"),
      availableAfterDays: optionalInt("availableAfterDays"),
    },
  });

  revalidatePath("/protecao/beneficios");
}

export async function deleteBenefit(formData: FormData) {
  const workspaceId = await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Proteção não identificada.");
  await prisma.benefitEntitlement.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/protecao/beneficios");
}
