import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";

/**
 * §13 Compromissos — "marcar como pago" em 1 toque: A_PAGAR->PAGO,
 * A_RECEBER->RECEBIDO. Compartilhado entre a API (/api/entries/:id/settle)
 * e a Server Action da tela de Compromissos, pra não duplicar a regra.
 */
export async function settleEntry(entryId: string, workspaceId: string, profileId: string) {
  const existing = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!existing || existing.workspaceId !== workspaceId) {
    throw new ApiError(404, "Lançamento não encontrado.");
  }

  let nextStatus: string;
  if (existing.statusCode === "A_PAGAR") nextStatus = "PAGO";
  else if (existing.statusCode === "A_RECEBER") nextStatus = "RECEBIDO";
  else {
    throw new ApiError(400, `Situação "${existing.statusCode}" não é liquidável por este atalho.`);
  }

  return prisma.entry.update({
    where: { id: entryId },
    data: { statusCode: nextStatus, settledAt: new Date(), updatedBy: profileId },
  });
}
