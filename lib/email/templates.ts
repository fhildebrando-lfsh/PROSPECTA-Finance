/** Casca visual simples e consistente pros e-mails transacionais do app. */
function emailShell(bodyHtml: string): string {
  return `
    <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; background:#09090b; padding:32px 16px;">
      <div style="max-width:480px; margin:0 auto; background:#18181b; border-radius:16px; padding:32px; color:#fafafa;">
        <p style="margin:0 0 24px; font-size:18px; font-weight:600;">PROSPECTA Finance</p>
        ${bodyHtml}
      </div>
    </div>
  `;
}

export function clientInviteEmail(params: { clientName: string; inviteUrl: string }): string {
  return emailShell(`
    <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">Olá, ${params.clientName}!</p>
    <p style="margin:0 0 24px; font-size:15px; line-height:1.5; color:#d4d4d8;">
      Você foi convidado(a) pra usar o PROSPECTA Finance. Clique no botão abaixo pra criar sua senha e acessar sua conta.
    </p>
    <a href="${params.inviteUrl}" style="display:inline-block; background:#f59e0b; color:#09090b; font-weight:600; padding:12px 24px; border-radius:8px; text-decoration:none;">
      Criar minha senha
    </a>
    <p style="margin:24px 0 0; font-size:12px; color:#71717a;">Se você não esperava este convite, pode ignorar este e-mail.</p>
  `);
}

export function accountDeletedByAdminEmail(): string {
  return emailShell(`
    <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">
      Sua conta no PROSPECTA Finance foi excluída por um administrador da plataforma.
    </p>
    <p style="margin:0; font-size:15px; line-height:1.5; color:#d4d4d8;">
      Todos os seus dados foram removidos permanentemente. Se você não esperava esta ação, entre em contato com quem administra sua conta.
    </p>
  `);
}
