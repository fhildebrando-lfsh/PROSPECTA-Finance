const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

/**
 * Dois escopos de Agenda são necessários, não um: `calendar.events` cobre
 * criar/editar/apagar EVENTOS, mas criar/apagar o próprio calendário
 * dedicado (`Calendars.insert`/`Calendars.delete`) é uma operação de
 * gerenciamento de calendário, coberta só por `calendar.calendars` — sem
 * ele a criação do calendário falha com 403 ACCESS_TOKEN_SCOPE_INSUFFICIENT
 * mesmo com `calendar.events` concedido (confirmado em produção, 2026-08-09).
 * Nenhum dos dois lê a agenda pessoal do cliente fora do calendário dedicado.
 */
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendars",
  "openid",
  "email",
].join(" ");

const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendars",
];

const CALENDAR_NAME = "PROSPECTA Finance";
const CALENDAR_DESCRIPTION =
  "Compromissos financeiros (a pagar/a receber) sincronizados automaticamente pela PROSPECTA Finance. " +
  "Some daqui quando o lançamento é liquidado no sistema.";

/** Cor do evento — mesmo código de despesa (vermelho) / receita (verde) já usado no resto do app. */
export const GOOGLE_COLOR_ID = { DESPESA: "11", RECEITA: "10" } as const;

export type GoogleTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresInSeconds: number;
};

export type GoogleCalendarEventInput = {
  /** Data no formato AAAA-MM-DD — o evento é sempre de dia inteiro (compromisso não tem hora). */
  date: string;
  summary: string;
  description?: string;
  colorId: string;
};

function config() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CALENDAR_CLIENT_ID / GOOGLE_CALENDAR_CLIENT_SECRET não configuradas.");
  }
  return { clientId, clientSecret };
}

/** Data seguinte em AAAA-MM-DD, para o `end.date` (exclusivo) exigido pela API do Google em eventos de dia inteiro. */
function nextDayIso(dateIso: string): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

async function googleFetch(url: string, accessToken: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
  });
  return res;
}

async function throwIfNotOk(res: Response, action: string) {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha ao ${action} (${res.status}): ${body}`);
  }
}

/** Monta a URL de consentimento do Google — `state` carrega o `workspaceId` assinado (ver rota /connect). */
export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const { clientId } = config();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** Troca o `code` do callback OAuth por tokens + descobre o e-mail da conta conectada. */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken: string; expiresInSeconds: number; email: string }> {
  const { clientId, clientSecret } = config();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  await throwIfNotOk(res, "trocar código OAuth por tokens");
  const json = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };
  if (!json.refresh_token) {
    throw new Error(
      "Google não devolveu refresh_token — provavelmente já havia uma autorização anterior sem revogar. " +
        "Peça para o cliente remover o acesso em myaccount.google.com/permissions e conectar de novo.",
    );
  }
  // Falha cedo e com mensagem clara em vez de deixar a 403 genérica da Calendar API
  // dois passos depois — `scope` no retorno do token é o que o Google REALMENTE
  // concedeu, que pode ser menor que o `scope` pedido na URL de autorização.
  const grantedScopes = (json.scope ?? "").split(" ").filter(Boolean);
  console.log("[google-calendar] escopos concedidos pelo Google:", grantedScopes.join(", ") || "(nenhum informado)");
  const missingScopes = REQUIRED_SCOPES.filter((scope) => !grantedScopes.includes(scope));
  if (missingScopes.length > 0) {
    throw new Error(
      `O Google não concedeu todas as permissões necessárias nesta autorização — faltando: ${missingScopes.join(", ")}.`,
    );
  }

  const userinfoRes = await googleFetch(USERINFO_URL, json.access_token);
  await throwIfNotOk(userinfoRes, "obter o e-mail da conta Google conectada");
  const userinfo = (await userinfoRes.json()) as { email: string };

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresInSeconds: json.expires_in,
    email: userinfo.email,
  };
}

/** Renova o access token a partir do refresh token — o Google normalmente não devolve um refresh_token novo. */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const { clientId, clientSecret } = config();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  await throwIfNotOk(res, "renovar o access token do Google");
  const json = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: json.access_token, refreshToken: null, expiresInSeconds: json.expires_in };
}

/** Revoga o token no Google (melhor esforço — chamado ao desconectar). */
export async function revokeToken(token: string): Promise<void> {
  const res = await fetch(REVOKE_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  });
  if (!res.ok && res.status !== 400) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha ao revogar token no Google (${res.status}): ${body}`);
  }
}

/** Cria o calendário dedicado "PROSPECTA Finance" na conta do cliente e devolve o ID dele. */
export async function createDedicatedCalendar(accessToken: string): Promise<string> {
  const res = await googleFetch(`${CALENDAR_API}/calendars`, accessToken, {
    method: "POST",
    body: JSON.stringify({ summary: CALENDAR_NAME, description: CALENDAR_DESCRIPTION }),
  });
  await throwIfNotOk(res, "criar o calendário dedicado no Google Agenda");
  const json = (await res.json()) as { id: string };
  return json.id;
}

/** Apaga o calendário dedicado inteiro (e todos os eventos nele) — usado na desconexão, 1 chamada só. */
export async function deleteCalendar(accessToken: string, calendarId: string): Promise<void> {
  const res = await googleFetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}`, accessToken, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    await throwIfNotOk(res, "apagar o calendário dedicado no Google Agenda");
  }
}

/** Cria um evento de dia inteiro no calendário dedicado e devolve o ID do evento. */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: GoogleCalendarEventInput,
): Promise<string> {
  const res = await googleFetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      colorId: event.colorId,
      start: { date: event.date },
      end: { date: nextDayIso(event.date) },
    }),
  });
  await throwIfNotOk(res, "criar evento no Google Agenda");
  const json = (await res.json()) as { id: string };
  return json.id;
}

/** Atualiza um evento existente (ex.: data ou valor do compromisso mudou). */
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: GoogleCalendarEventInput,
): Promise<void> {
  const res = await googleFetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        colorId: event.colorId,
        start: { date: event.date },
        end: { date: nextDayIso(event.date) },
      }),
    },
  );
  await throwIfNotOk(res, "atualizar evento no Google Agenda");
}

/** Apaga um evento — idempotente: 404/410 (já não existe) não é erro. */
export async function deleteCalendarEvent(accessToken: string, calendarId: string, eventId: string): Promise<void> {
  const res = await googleFetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    await throwIfNotOk(res, "apagar evento no Google Agenda");
  }
}
