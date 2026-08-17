"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Encerra a sessão **e invalida o cache de rota de todo o layout**.
 *
 * O `revalidatePath("/", "layout")` não é zelo excessivo: o App Router mantém
 * um Router Cache no navegador com o RSC já renderizado, e quem decide se o
 * menu **Admin** aparece é o layout (`isPlatformAdmin`). Sem invalidar, o
 * próximo login no mesmo navegador podia receber o layout do usuário anterior
 * e ver o menu Admin sem ser admin — que foi o sintoma relatado em 2026-08-17.
 *
 * Era só aparência: as sete telas sob `/admin` exigem `requireAdminProfile()`
 * no servidor, então clicar levava a erro de autorização, não a dado alheio.
 * Ainda assim, menu que promete o que não entrega é defeito.
 *
 * Precisa vir **antes** do `redirect()`, que interrompe a execução lançando.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
