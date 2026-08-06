"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { deleteAccountAsAdmin } from "@/lib/account/delete";

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
