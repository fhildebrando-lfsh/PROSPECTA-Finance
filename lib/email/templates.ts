/** Casca visual simples e consistente para os e-mails transacionais do app. */
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
      Você foi convidado(a) para usar o PROSPECTA Finance. Clique no botão abaixo para criar sua senha e acessar sua conta.
    </p>
    <a href="${params.inviteUrl}" style="display:inline-block; background:#f59e0b; color:#09090b; font-weight:600; padding:12px 24px; border-radius:8px; text-decoration:none;">
      Criar minha senha
    </a>
    <p style="margin:24px 0 0; font-size:12px; color:#71717a;">Se você não esperava este convite, pode ignorar este e-mail.</p>
  `);
}

export function pendingApprovalNotificationEmail(params: { personName: string; personEmail: string; adminUrl: string }): string {
  return emailShell(`
    <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">Novo cadastro aguardando aprovação</p>
    <p style="margin:0 0 24px; font-size:15px; line-height:1.5; color:#d4d4d8;">
      <strong>${params.personName}</strong> (${params.personEmail}) acabou de se cadastrar no PROSPECTA Finance por conta própria, sem convite. O acesso está pausado até você aprovar.
    </p>
    <a href="${params.adminUrl}" style="display:inline-block; background:#f59e0b; color:#09090b; font-weight:600; padding:12px 24px; border-radius:8px; text-decoration:none;">
      Ver em Admin → Usuários
    </a>
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
