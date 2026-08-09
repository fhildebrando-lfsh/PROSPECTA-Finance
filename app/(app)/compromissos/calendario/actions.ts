"use server";

import { revalidatePath } from "next/cache";
import { assertCanWrite, requireProfile, requireWorkspaceId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { deleteCalendar, revokeToken } from "@/lib/integrations/google-calendar/client";
import { getValidAccessToken } from "@/lib/integrations/google-calendar/sync";
import { decrypt } from "@/lib/security/crypto";

/**
 * Desconecta o Google Agenda deste workspace: revoga o token e apaga o
 * calendário dedicado (melhor esforço — cada etapa é logada e engolida
 * separadamente, para a desconexão local nunca ficar travada por uma falha
 * de rede com o Google), depois marca a conexão como revogada e limpa
 * `googleEventId` de todos os lançamentos (não há mais evento nenhum lá).
 */
export async function disconnectGoogleCalendar() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin);

  const connection = await prisma.googleCalendarConnection.findFirst({ where: { workspaceId, revokedAt: null } });
  if (!connection) return;

  try {
    const accessToken = await getValidAccessToken(connection);
    await deleteCalendar(accessToken, connection.googleCalendarId);
  } catch (err) {
    console.error("[google-calendar] falha ao apagar o calendário dedicado ao desconectar:", err);
  }

  try {
    await revokeToken(decrypt(connection.refreshToken));
  } catch (err) {
    console.error("[google-calendar] falha ao revogar o token no Google ao desconectar:", err);
  }

  await prisma.$transaction([
    prisma.googleCalendarConnection.update({ where: { id: connection.id }, data: { revokedAt: new Date() } }),
    prisma.entry.updateMany({ where: { workspaceId, googleEventId: { not: null } }, data: { googleEventId: null } }),
  ]);

  revalidatePath("/compromissos/calendario");
}
