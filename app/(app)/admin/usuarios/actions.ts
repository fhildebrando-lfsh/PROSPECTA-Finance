"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { deleteAccountAsAdmin } from "@/lib/account/delete";
import { assignAdvisor } from "@/lib/workspace/advisor";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";

export type DeleteUserState = { error: string | null };

export async function deleteUser(_prevState: DeleteUserState, formData: FormData): Promise<DeleteUserState> {
  const admin = await requireAdminProfile();

  const profileId = String(formData.get("profileId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (profileId === admin.id) return { error: "Use 'Minha conta' pra excluir a sua própria conta." };
  if (confirmation !== "EXCLUIR") return { error: 'Digite "EXCLUIR" (em maiúsculas) pra confirmar.' };

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

/**
 * Promove/remove admin da plataforma. Nunca a própria conta — evita se
 * autorremover por engano e ficar sem nenhum admin (teria que ir direto no
 * banco pra corrigir).
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
