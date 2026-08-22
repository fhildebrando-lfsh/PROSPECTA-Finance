"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { DebtStatus } from "@/app/generated/prisma/enums";

const STATUSES: DebtStatus[] = ["EM_DIA", "NEGATIVADO", "RENEGOCIADO", "QUITADO"];

async function contexto() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new ApiError(403, "Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);

  if (!(await hasFeature(workspaceId, "mec_completo"))) {
    throw new ApiError(403, "O Mapa de Endividamento faz parte da consultoria.");
  }
  return { workspaceId };
}

/** Vazio vira `null`, nunca zero: zero afirma "não custa nada", e não sabemos. */
function numeroOpcional(raw: FormDataEntryValue | null): string | null {
  const v = String(raw ?? "").trim().replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

export async function salvarDivida(formData: FormData) {
  const { workspaceId } = await contexto();

  const id = String(formData.get("id") ?? "");
  const creditorName = String(formData.get("creditorName") ?? "").trim();
  const modality = String(formData.get("modality") ?? "").trim();
  const saldoRaw = numeroOpcional(formData.get("outstandingBalance"));

  if (!creditorName) throw new ApiError(400, "Informe o credor.");
  if (!modality) throw new ApiError(400, "Informe a modalidade.");
  if (saldoRaw === null) throw new ApiError(400, "Informe o saldo devedor.");

  const statusRaw = String(formData.get("status") ?? "EM_DIA") as DebtStatus;
  const status = STATUSES.includes(statusRaw) ? statusRaw : "EM_DIA";

  const alvoRaw = String(formData.get("quitationTargetDate") ?? "").trim();

  const dados = {
    creditorName,
    modality,
    outstandingBalance: saldoRaw,
    cetAnnualPercent: numeroOpcional(formData.get("cetAnnualPercent")),
    hasNegativacao: formData.get("hasNegativacao") === "on",
    hasLegalAction: formData.get("hasLegalAction") === "on",
    status,
    quitationTargetDate: alvoRaw ? new Date(`${alvoRaw}T00:00:00.000Z`) : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  if (id) {
    // `updateMany` com workspaceId no filtro: id de outro workspace não acha
    // linha em vez de atualizar a alheia.
    const { count } = await prisma.debt.updateMany({ where: { id, workspaceId }, data: dados });
    if (count === 0) throw new ApiError(404, "Dívida não encontrada.");
  } else {
    await prisma.debt.create({ data: { workspaceId, ...dados } });
  }

  revalidatePath("/patrimonio/mec");
}

export async function excluirDivida(formData: FormData) {
  const { workspaceId } = await contexto();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new ApiError(400, "Dívida inválida.");

  await prisma.debt.deleteMany({ where: { id, workspaceId } });
  revalidatePath("/patrimonio/mec");
}
