import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { buildGoogleAuthUrl } from "@/lib/integrations/google-calendar/client";
import { encrypt } from "@/lib/security/crypto";

/**
 * GET /api/integrations/google-calendar/connect — inicia o vínculo OAuth
 * (separado do "Entrar com Google" de login, ver lib/integrations/google-calendar/client.ts).
 * `state` carrega o workspace atual cifrado, para o callback confirmar que
 * ninguém trocou de workspace no meio do fluxo.
 */
export async function GET(request: NextRequest) {
  const { workspaceId, profileId } = await requireApiWorkspaceMembership();

  const redirectUri = new URL("/api/integrations/google-calendar/callback", request.url).toString();
  const state = encrypt(JSON.stringify({ workspaceId, profileId, nonce: randomUUID() }));

  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}
