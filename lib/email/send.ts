const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER = { name: "PROSPECTA Finance", email: "admin@prospectafinance.com.br" };

/**
 * E-mail transacional próprio do app (diferente do e-mail que o Supabase Auth
 * manda sozinho pra confirmação/recuperação de senha) — usa a API HTTP do
 * Brevo direto, sem SMTP (mais adequado a serverless). Precisa de
 * `BREVO_API_KEY` no ambiente (Settings → SMTP & API → Chaves API no
 * painel do Brevo — não é a mesma chave SMTP usada no Supabase).
 */
export async function sendEmail(params: { to: string; toName?: string; subject: string; html: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY não configurada.");

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: params.to, name: params.toName }],
      subject: params.subject,
      htmlContent: params.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar e-mail via Brevo (${res.status}): ${body}`);
  }
}
