import { NextResponse, type NextRequest } from "next/server";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createDedicatedCalendar, exchangeCodeForTokens } from "@/lib/integrations/google-calendar/client";
import { decrypt, encrypt } from "@/lib/security/crypto";

/**
 * GET /api/integrations/google-calendar/callback — troca `code` por tokens,
 * cria o calendário dedicado na conta do cliente e grava a conexão. Sempre
 * volta para /compromissos/calendario (sucesso ou falha vira query param —
 * essa rota nunca é a página final, só um passo intermediário do fluxo).
 */
export async function GET(request: NextRequest) {
  const redirectTarget = new URL("/compromissos/calendario", request.url);

  try {
    const { workspaceId, profileId } = await requireApiWorkspaceMembership();

    const url = new URL(request.url);
    const errorParam = url.searchParams.get("error");
    if (errorParam) {
      redirectTarget.searchParams.set("google_error", "1");
      return NextResponse.redirect(redirectTarget);
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) throw new Error("Callback do Google sem code/state.");

    const statePayload = JSON.parse(decrypt(state)) as { workspaceId: string };
    if (statePayload.workspaceId !== workspaceId) {
      throw new Error("state do OAuth não confere com o workspace atual da sessão.");
    }

    const redirectUri = new URL("/api/integrations/google-calendar/callback", request.url).toString();
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const googleCalendarId = await createDedicatedCalendar(tokens.accessToken);
    const accessTokenExpiresAt = new Date(Date.now() + tokens.expiresInSeconds * 1000);

    await prisma.googleCalendarConnection.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        googleAccountEmail: tokens.email,
        googleCalendarId,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        accessTokenExpiresAt,
        connectedByProfileId: profileId,
      },
      update: {
        googleAccountEmail: tokens.email,
        googleCalendarId,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
        accessTokenExpiresAt,
        connectedByProfileId: profileId,
        connectedAt: new Date(),
        revokedAt: null,
      },
    });

    redirectTarget.searchParams.set("google_connected", "1");
    return NextResponse.redirect(redirectTarget);
  } catch (err) {
    console.error("[google-calendar] callback falhou:", err);
    redirectTarget.searchParams.set("google_error", "1");
    return NextResponse.redirect(redirectTarget);
  }
}
