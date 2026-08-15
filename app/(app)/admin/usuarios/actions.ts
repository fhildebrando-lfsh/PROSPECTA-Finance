"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { deleteAccountAsAdmin } from "@/lib/account/delete";
import { assignAdvisor, setAdvisorWriteAccess } from "@/lib/workspace/advisor";
import { blockWorkspace, unblockWorkspace } from "@/lib/workspace/block";
import { grantPlan, revokePlanGrant } from "@/lib/billing/plan-grant";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { updatePersonalData, personalDataFromFormData } from "@/lib/profile/update";
import type { WorkspaceBlockReason } from "@/app/generated/prisma/enums";

export async function updateUserPersonalData(formData: FormData) {
  await requireAdminProfile();
  const profileId = String(formData.get("profileId") ?? "");
  if (!profileId) throw new ApiError(400, "Usuário inválido.");
  await updatePersonalData(profileId, personalDataFromFormData(formData));
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${profileId}`);
}

export type DeleteUserState = { error: string | null };

export async function deleteUser(_prevState: DeleteUserState, formData: FormData): Promise<DeleteUserState> {
  const admin = await requireAdminProfile();

  const profileId = String(formData.get("profileId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (profileId === admin.id) return { error: "Use 'Minha conta' para excluir a sua própria conta." };
  if (confirmation !== "EXCLUIR") return { error: 'Digite "EXCLUIR" (em maiúsculas) para confirmar.' };

  await deleteAccountAsAdmin(profileId);
  revalidatePath("/admin/usuarios");
  return { error: null };
}

export async function setAdvisor(formData: FormData) {
  await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const advisorProfileId = String(formData.get("advisorProfileId") ?? "").trim() || null;

  await assignAdvisor(workspaceId, advisorProfileId);
  revalidatePath("/admin/usuarios");
}

/** Etapa 0 (2026-08-15) — concede ou revoga a escrita do consultor ativo. */
export async function setAdvisorWrite(formData: FormData) {
  const admin = await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const canWrite = formData.get("canWrite") === "true";
  if (!workspaceId) throw new ApiError(400, "Workspace inválido.");

  await setAdvisorWriteAccess({ workspaceId, canWrite, actorProfileId: admin.id });
  revalidatePath("/admin/usuarios");
}

export async function blockWorkspaceAccess(formData: FormData) {
  const admin = await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const reason = String(formData.get("reason") ?? "") as WorkspaceBlockReason;
  const detail = String(formData.get("detail") ?? "").trim() || null;
  if (!workspaceId || !reason) throw new ApiError(400, "Selecione o motivo do bloqueio.");

  await blockWorkspace({ workspaceId, reason, detail, blockedBy: admin.id });
  revalidatePath("/admin/usuarios");
}

export async function unblockWorkspaceAccess(formData: FormData) {
  await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  if (!workspaceId) throw new ApiError(400, "Workspace inválido.");

  await unblockWorkspace(workspaceId);
  revalidatePath("/admin/usuarios");
}

/**
 * Promove/remove admin da plataforma. Nunca a própria conta — evita se
 * autorremover por engano e ficar sem nenhum admin (teria que ir direto no
 * banco para corrigir).
 */
export async function setPlatformAdmin(formData: FormData) {
  const admin = await requireAdminProfile();

  const profileId = String(formData.get("profileId") ?? "");
  const makeAdmin = formData.get("makeAdmin") === "true";
  if (profileId === admin.id) throw new ApiError(400, "Não é possível alterar seu próprio status de admin por aqui.");

  await prisma.profile.update({
    where: { id: profileId },
    data: { isPlatformAdmin: makeAdmin, platformRole: makeAdmin ? "PLATFORM_ADMIN" : "NONE" },
  });
  revalidatePath("/admin/usuarios");
}

/**
 * Etapa 4 do Método (2026-08-15) — concessão manual de PlanGrant (camada 2
 * do modelo de direitos, §4.6). Sem ConsultingEngagement ainda (Etapa 8),
 * toda concessão nasce daqui — ex.: cortesia, teste, acesso antecipado.
 * Nunca toca na Subscription do workspace.
 */
export async function grantWorkspacePlan(formData: FormData) {
  const admin = await requireAdminProfile();

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  if (!workspaceId || !planId || !reason || !endsAtRaw) {
    throw new ApiError(400, "Plano, motivo e data de término são obrigatórios.");
  }

  await grantPlan({ workspaceId, planId, reason, endsAt: new Date(endsAtRaw), createdBy: admin.id });
  revalidatePath("/admin/usuarios");
}

export async function revokeWorkspacePlanGrant(formData: FormData) {
  await requireAdminProfile();

  const grantId = String(formData.get("grantId") ?? "");
  if (!grantId) throw new ApiError(400, "Concessão inválida.");

  await revokePlanGrant(grantId);
  revalidatePath("/admin/usuarios");
}
