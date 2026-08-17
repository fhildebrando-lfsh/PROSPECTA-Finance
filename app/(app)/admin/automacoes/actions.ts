"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { runDueAutomations } from "@/lib/method/run-automations";

/**
 * Dispara a mesma rotina do cron, agora. Existe por dois motivos práticos:
 * conferir que a rotina funciona sem esperar até as 9h UTC do dia seguinte, e
 * poder reprocessar depois de uma falha registrada.
 *
 * `source: "MANUAL"` separa esta execução das do cron no rastro — senão um
 * disparo de teste pareceria uma execução agendada e mascararia a ausência da
 * automática, que é justamente o que o rastro existe para revelar.
 *
 * Admin-only: roda sobre **todos** os workspaces da plataforma.
 */
export async function executarAutomacoesAgora() {
  await requireAdminProfile();
  const resultado = await runDueAutomations(new Date(), "MANUAL");
  revalidatePath("/admin/automacoes");
  return resultado;
}
