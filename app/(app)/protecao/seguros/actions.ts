"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import type { InsuranceKind } from "@/app/generated/prisma/enums";

const KINDS: InsuranceKind[] = [
  "VIDA",
  "INCAPACIDADE",
  "PROTECAO_RENDA",
  "SAUDE",
  "ODONTOLOGICO",
  "AUTOMOVEL",
  "RESIDENCIAL",
  "PRESTAMISTA",
  "EMPRESARIAL",
  "OUTRO",
];

async function guard() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);
  if (!(await hasFeature(workspaceId, "seguros_cadastro"))) {
    throw new Error("O cadastro de seguros está disponível a partir do plano Max.");
  }
  return workspaceId;
}

function optionalText(formData: FormData, field: string): string | null {
  const v = String(formData.get(field) ?? "").trim();
  return v === "" ? null : v;
}

function optionalDecimal(formData: FormData, field: string): string | null {
  const v = String(formData.get(field) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error("Valor informado inválido.");
  return n.toFixed(2);
}

function optionalInt(formData: FormData, field: string): number | null {
  const v = String(formData.get(field) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error("Prazo informado inválido.");
  return Math.round(n);
}

export async function createInsurancePolicy(formData: FormData) {
  const workspaceId = await guard();

  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as InsuranceKind;
  if (!name) throw new Error("Informe um nome para a apólice.");
  if (!KINDS.includes(kind)) throw new Error("Tipo de seguro inválido.");

  const rawPersonId = String(formData.get("personId") ?? "");
  let personId: string | null = null;
  if (rawPersonId !== "") {
    const person = await prisma.person.findFirst({ where: { id: rawPersonId, workspaceId } });
    if (!person) throw new Error("Pessoa não encontrada neste workspace.");
    personId = person.id;
  }

  await prisma.insurancePolicy.create({
    data: {
      workspaceId,
      personId,
      kind,
      name,
      insurerName: optionalText(formData, "insurerName"),
      premiumMonthly: optionalDecimal(formData, "premiumMonthly") ?? undefined,
    },
  });

  revalidatePath("/protecao/seguros");
}

export async function deleteInsurancePolicy(formData: FormData) {
  const workspaceId = await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Apólice não identificada.");
  // Coberturas caem junto por cascade — elas não têm significado sem a apólice.
  await prisma.insurancePolicy.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/protecao/seguros");
}

/**
 * §26 — a cobertura é o que o motor de risco realmente consome. Franquia,
 * carência e prazo de indenização são os três números que decidem se a apólice
 * reduz ou não a necessidade de liquidez.
 */
export async function createCoverage(formData: FormData) {
  const workspaceId = await guard();

  const policyId = String(formData.get("policyId") ?? "");
  const riskCovered = String(formData.get("riskCovered") ?? "").trim();
  if (!policyId || !riskCovered) throw new Error("Informe a apólice e o risco coberto.");

  // Nunca confiar no id vindo do formulário: a apólice precisa ser deste workspace.
  const policy = await prisma.insurancePolicy.findFirst({ where: { id: policyId, workspaceId } });
  if (!policy) throw new Error("Apólice não encontrada neste workspace.");

  await prisma.insuranceCoverage.create({
    data: {
      policyId: policy.id,
      riskCovered,
      capitalInsured: optionalDecimal(formData, "capitalInsured") ?? undefined,
      deductible: optionalDecimal(formData, "deductible") ?? undefined,
      waitingPeriodDays: optionalInt(formData, "waitingPeriodDays"),
      payoutDelayDays: optionalInt(formData, "payoutDelayDays"),
    },
  });

  revalidatePath("/protecao/seguros");
}

export async function deleteCoverage(formData: FormData) {
  const workspaceId = await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Cobertura não identificada.");
  // Confere o tenant pela apólice-mãe (a cobertura não carrega workspaceId).
  const coverage = await prisma.insuranceCoverage.findFirst({
    where: { id, policy: { workspaceId } },
  });
  if (!coverage) throw new Error("Cobertura não encontrada neste workspace.");
  await prisma.insuranceCoverage.delete({ where: { id: coverage.id } });
  revalidatePath("/protecao/seguros");
}
