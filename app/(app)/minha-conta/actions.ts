"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount } from "@/lib/account/delete";
import { updatePersonalData, personalDataFromFormData } from "@/lib/profile/update";

export async function updateMyPersonalData(formData: FormData) {
  const profile = await requireProfile();
  await updatePersonalData(profile.id, personalDataFromFormData(formData));
  revalidatePath("/minha-conta");
}

export type DeleteAccountState = { error: string | null };

export async function deleteMyAccount(
  _prevState: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const profile = await requireProfile();

  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "EXCLUIR") return { error: 'Digite "EXCLUIR" (em maiúsculas) pra confirmar.' };

  await deleteAccount(profile.id);

  const supabase = await createClient();
  await supabase.auth.signOut().catch(() => {});

  redirect("/login");
}
