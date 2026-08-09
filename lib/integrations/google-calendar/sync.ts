import { prisma } from "@/lib/db/prisma";
import { formatCurrencyBRL } from "@/lib/format";
import { decrypt, encrypt } from "@/lib/security/crypto";
import {
  GOOGLE_COLOR_ID,
  createCalendarEvent,
  deleteCalendarEvent,
  refreshAccessToken,
  updateCalendarEvent,
  type GoogleCalendarEventInput,
} from "@/lib/integrations/google-calendar/client";
import type { GoogleCalendarConnection } from "@/app/generated/prisma/client";

export type GoogleCalendarAction = "create" | "update" | "delete" | "noop";

/**
 * Lógica pura de decisão (testável sem rede/banco): A_PAGAR/A_RECEBER com
 * evento ainda não criado -> criar; já criado -> atualizar; qualquer outra
 * situação (pago, recebido, isento...) com evento existente -> apagar (regra
 * confirmada com o usuário: liquidado some da agenda). Sem evento e sem estar
 * em aberto -> nada a fazer.
 */
export function decideGoogleCalendarAction(entry: {
  statusCode: string;
  googleEventId: string | null;
}): GoogleCalendarAction {
  const isOpen = entry.statusCode === "A_PAGAR" || entry.statusCode === "A_RECEBER";
  if (isOpen) return entry.googleEventId ? "update" : "create";
  return entry.googleEventId ? "delete" : "noop";
}

/** dd->AAAA-MM-DD ignorando fuso — mesma convenção de data "pura" de lib/format.ts. */
function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Devolve um access token válido, renovando via refresh token quando perto de expirar. Exportada para a desconexão (precisa apagar o calendário dedicado). */
export async function getValidAccessToken(connection: GoogleCalendarConnection): Promise<string> {
  const REFRESH_BUFFER_MS = 60_000;
  if (connection.accessTokenExpiresAt.getTime() > Date.now() + REFRESH_BUFFER_MS) {
    return decrypt(connection.accessToken);
  }

  const refreshed = await refreshAccessToken(decrypt(connection.refreshToken));
  const accessTokenExpiresAt = new Date(Date.now() + refreshed.expiresInSeconds * 1000);
  await prisma.googleCalendarConnection.update({
    where: { id: connection.id },
    data: { accessToken: encrypt(refreshed.accessToken), accessTokenExpiresAt },
  });
  return refreshed.accessToken;
}

/**
 * Ponto único de sincronização de um lançamento — chamado depois de criar,
 * editar, liquidar ou excluir um compromisso (ver pontos de chamada em
 * lib/entries/create.ts, lib/entries/settle.ts, etc.). Melhor esforço: nunca
 * lança exceção, para não quebrar um fluxo financeiro real por causa de uma
 * falha na API do Google.
 */
export async function syncEntryToGoogleCalendar(entryId: string): Promise<void> {
  try {
    const entry = await prisma.entry.findUnique({ where: { id: entryId }, include: { category: true } });
    if (!entry) return;

    const connection = await prisma.googleCalendarConnection.findFirst({
      where: { workspaceId: entry.workspaceId, revokedAt: null },
    });
    if (!connection) return;

    const action = decideGoogleCalendarAction(entry);
    if (action === "noop") return;

    const accessToken = await getValidAccessToken(connection);

    if (action === "delete") {
      await deleteCalendarEvent(accessToken, connection.googleCalendarId, entry.googleEventId!);
      await prisma.entry.update({ where: { id: entry.id }, data: { googleEventId: null } });
      return;
    }

    const eventInput: GoogleCalendarEventInput = {
      date: dateToIso(entry.dueDate),
      summary: entry.description,
      description: `${entry.category.name} · ${formatCurrencyBRL(entry.amount)}`,
      colorId: entry.nature === "DESPESA" ? GOOGLE_COLOR_ID.DESPESA : GOOGLE_COLOR_ID.RECEITA,
    };

    if (action === "create") {
      const googleEventId = await createCalendarEvent(accessToken, connection.googleCalendarId, eventInput);
      await prisma.entry.update({ where: { id: entry.id }, data: { googleEventId } });
    } else {
      await updateCalendarEvent(accessToken, connection.googleCalendarId, entry.googleEventId!, eventInput);
    }
  } catch (err) {
    console.error(`[google-calendar] falha ao sincronizar lançamento ${entryId}:`, err);
  }
}

/**
 * Apaga o evento correspondente a um lançamento que acabou de ser excluído
 * (não dá pra reler `googleEventId` de uma linha já apagada do banco).
 * Melhor esforço, mesma garantia de nunca lançar exceção.
 */
export async function deleteEntryGoogleCalendarEvent(workspaceId: string, googleEventId: string): Promise<void> {
  try {
    const connection = await prisma.googleCalendarConnection.findFirst({ where: { workspaceId, revokedAt: null } });
    if (!connection) return;

    const accessToken = await getValidAccessToken(connection);
    await deleteCalendarEvent(accessToken, connection.googleCalendarId, googleEventId);
  } catch (err) {
    console.error(`[google-calendar] falha ao apagar evento ${googleEventId} (workspace ${workspaceId}):`, err);
  }
}
