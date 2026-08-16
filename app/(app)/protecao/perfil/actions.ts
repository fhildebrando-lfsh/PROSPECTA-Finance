"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import type { IncomeSourceKind, RegimeTrabalho, SegundaAtividadeNivel } from "@/app/generated/prisma/enums";

const REGIMES: RegimeTrabalho[] = [
  "SERVIDOR_EFETIVO",
  "MILITAR",
  "EMPREGADO_PUBLICO",
  "CLT",
  "CARGO_COMISSIONADO",
  "TEMPORARIO",
  "PROFISSIONAL_LIBERAL",
  "AUTONOMO",
  "EMPRESARIO",
  "MEI",
  "INFORMAL",
  "APOSENTADO",
  "PENSIONISTA",
  "DESEMPREGADO",
  "OUTRO",
];

const NIVEIS: SegundaAtividadeNivel[] = [
  "RENDA_SECUNDARIA_ATIVA",
  "RENDA_SECUNDARIA_ADORMECIDA",
  "CAPACIDADE_POTENCIAL",
  "POSSIBILIDADE_TEORICA",
];

const KINDS: IncomeSourceKind[] = [
  "SALARIO",
  "PRO_LABORE",
  "AUTONOMO",
  "ALUGUEL",
  "APOSENTADORIA",
  "PENSAO",
  "BENEFICIO",
  "RENDA_PASSIVA",
  "BICO",
  "OUTRO",
];

async function guard() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);
  if (!(await hasFeature(workspaceId, "reserva_inteligente"))) {
    throw new Error("O perfil de risco está disponível a partir do plano Max.");
  }
  return workspaceId;
}

/** Texto opcional: string vazia vira null, nunca string vazia no banco. */
function optionalText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value === "" ? null : value;
}

/**
 * §19/§21 — perfil de risco de uma pessoa. Campo em branco grava `null`
 * ("não informado"), nunca um valor padrão: dado ausente precisa continuar
 * distinguível de dado declarado, porque a confiança da análise depende disso (§8/§9).
 */
export async function updatePersonRiskProfile(formData: FormData) {
  const workspaceId = await guard();

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Pessoa não identificada.");

  const rawRegime = String(formData.get("regimeTrabalho") ?? "");
  if (rawRegime !== "" && !REGIMES.includes(rawRegime as RegimeTrabalho)) {
    throw new Error("Regime de trabalho inválido.");
  }
  const rawNivel = String(formData.get("segundaAtividadeNivel") ?? "");
  if (rawNivel !== "" && !NIVEIS.includes(rawNivel as SegundaAtividadeNivel)) {
    throw new Error("Nível de segunda atividade inválido.");
  }

  const parseMonths = (field: string): number | null => {
    const raw = String(formData.get(field) ?? "").trim();
    if (raw === "") return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) throw new Error("Tempo informado inválido.");
    return Math.round(n);
  };

  await prisma.person.update({
    where: { id, workspaceId },
    data: {
      regimeTrabalho: rawRegime === "" ? null : (rawRegime as RegimeTrabalho),
      occupation: optionalText(formData, "occupation"),
      cargo: optionalText(formData, "cargo"),
      setor: optionalText(formData, "setor"),
      cboCode: optionalText(formData, "cboCode"),
      tenureCurrentMonths: parseMonths("tenureCurrentMonths"),
      experienceTotalMonths: parseMonths("experienceTotalMonths"),
      segundaAtividade: optionalText(formData, "segundaAtividade"),
      segundaAtividadeNivel: rawNivel === "" ? null : (rawNivel as SegundaAtividadeNivel),
      isDependent: formData.get("isDependent") === "on",
    },
  });

  revalidatePath("/protecao/perfil");
}

export async function createIncomeSource(formData: FormData) {
  const workspaceId = await guard();

  const personId = String(formData.get("personId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "") as IncomeSourceKind;
  if (!personId || !name) throw new Error("Informe a pessoa e o nome da fonte de renda.");
  if (!KINDS.includes(kind)) throw new Error("Tipo de fonte de renda inválido.");

  // A pessoa precisa ser do mesmo workspace — nunca confiar no id vindo do form.
  const person = await prisma.person.findFirst({ where: { id: personId, workspaceId } });
  if (!person) throw new Error("Pessoa não encontrada neste workspace.");

  const isPrincipal = formData.get("isPrincipal") === "on";

  await prisma.$transaction(async (tx) => {
    // §31 Cenário B simula a interrupção da fonte principal — mais de uma
    // principal por pessoa tornaria o cenário ambíguo.
    if (isPrincipal) {
      await tx.incomeSource.updateMany({ where: { workspaceId, personId }, data: { isPrincipal: false } });
    }
    await tx.incomeSource.create({
      data: {
        workspaceId,
        personId,
        name,
        kind,
        employerName: optionalText(formData, "employerName"),
        setor: optionalText(formData, "setor"),
        isPrincipal,
      },
    });
  });

  revalidatePath("/protecao/perfil");
}

export async function deleteIncomeSource(formData: FormData) {
  const workspaceId = await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Fonte de renda não identificada.");
  await prisma.incomeSource.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/protecao/perfil");
}
