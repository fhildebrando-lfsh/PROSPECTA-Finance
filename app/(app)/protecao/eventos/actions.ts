"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { ShockKind } from "@/app/generated/prisma/enums";

const KINDS: ShockKind[] = [
  "PERDA_DE_RENDA",
  "REDUCAO_DE_RENDA",
  "DESPESA_INESPERADA",
  "INCAPACIDADE",
  "EMERGENCIA_FAMILIAR",
  "REPARO_ESSENCIAL",
  "OUTRO",
];

async function guard() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new ApiError(403, "Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);
  if (!(await hasFeature(workspaceId, "reserva_inteligente"))) {
    throw new ApiError(403, "O registro de eventos está disponível a partir do plano Max.");
  }
  return { workspaceId, profile };
}

function decimalOpcional(formData: FormData, field: string): string | undefined {
  const v = String(formData.get(field) ?? "").trim();
  if (v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new ApiError(400, "Valor informado inválido.");
  return n.toFixed(2);
}

function inteiroOpcional(formData: FormData, field: string): number | null {
  const v = String(formData.get(field) ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new ApiError(400, "Número informado inválido.");
  return Math.round(n);
}

/**
 * §13/§46 — registra um choque que de fato aconteceu.
 *
 * Este dado **muda o cálculo**: o maior desembolso do próprio bolso eleva o
 * piso de liquidez (§34). Por isso a validação é do lado do servidor e o campo
 * de seguro aceita três estados — sim, não e "não informado" —, porque
 * "não sei se tinha seguro" é diferente de "não tinha".
 */
export async function registrarChoque(formData: FormData) {
  const { workspaceId, profile } = await guard();

  const kind = String(formData.get("kind") ?? "") as ShockKind;
  const description = String(formData.get("description") ?? "").trim();
  const occurredAtRaw = String(formData.get("occurredAt") ?? "");
  if (!KINDS.includes(kind)) throw new ApiError(400, "Tipo de evento inválido.");
  if (!description || !occurredAtRaw) throw new ApiError(400, "Descrição e data são obrigatórias.");

  const rawPersonId = String(formData.get("personId") ?? "");
  let personId: string | null = null;
  if (rawPersonId !== "") {
    const person = await prisma.person.findFirst({ where: { id: rawPersonId, workspaceId } });
    if (!person) throw new ApiError(404, "Pessoa não encontrada neste workspace.");
    personId = person.id;
  }

  const rawSeguro = String(formData.get("hadInsurance") ?? "");
  const hadInsurance = rawSeguro === "sim" ? true : rawSeguro === "nao" ? false : null;

  await prisma.shockEvent.create({
    data: {
      workspaceId,
      personId,
      kind,
      description,
      occurredAt: new Date(occurredAtRaw),
      extraordinaryExpense: decimalOpcional(formData, "extraordinaryExpense"),
      incomeLossMonthly: decimalOpcional(formData, "incomeLossMonthly"),
      durationMonths: inteiroOpcional(formData, "durationMonths"),
      hadInsurance,
      reimbursedAmount: decimalOpcional(formData, "reimbursedAmount"),
      paidByUserAmount: decimalOpcional(formData, "paidByUserAmount"),
      daysUntilReimbursement: inteiroOpcional(formData, "daysUntilReimbursement"),
      reserveUsedAmount: decimalOpcional(formData, "reserveUsedAmount"),
      createdBy: profile.id,
    },
  });

  revalidatePath("/protecao/eventos");
  revalidatePath("/protecao/reserva");
}

/**
 * §45 item 8 — marca a reserva como reposta. Usar a reserva não é fracasso, é
 * ela funcionando; o que o sistema cobra é a reposição.
 */
export async function marcarRecomposto(formData: FormData) {
  const { workspaceId } = await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new ApiError(400, "Evento não identificado.");

  await prisma.shockEvent.updateMany({
    where: { id, workspaceId },
    data: { recomposedAt: new Date() },
  });

  revalidatePath("/protecao/eventos");
  revalidatePath("/protecao/reserva");
}

export async function excluirChoque(formData: FormData) {
  const { workspaceId } = await guard();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new ApiError(400, "Evento não identificado.");

  await prisma.shockEvent.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/protecao/eventos");
  revalidatePath("/protecao/reserva");
}
