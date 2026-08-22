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

/**
 * Etapa 10-B (§12.4) — pedido e lembrete de um instrumento de diagnóstico.
 *
 * Um só template para envio e lembrete, com o tom mudando conforme o caso. O
 * e-mail sempre diz **por que** aquilo está sendo pedido e **quanto tempo
 * leva**: §12.2 observa que o cliente omite no formulário o que é
 * constrangedor, e mensagem que parece cobrança burocrática aumenta a omissão.
 */
export function instrumentRequestEmail(params: {
  clientName: string;
  instrumentName: string;
  instrumentCode: string;
  url: string;
  /** null no primeiro envio; número do lembrete quando é cobrança. */
  reminderNumber: number | null;
  diasParaPrazo: number;
  estimatedMinutes: number | null;
}): string {
  const ehLembrete = params.reminderNumber !== null;
  const prazo =
    params.diasParaPrazo > 1
      ? `Faltam ${params.diasParaPrazo} dias para o prazo combinado.`
      : params.diasParaPrazo === 1
        ? "O prazo combinado termina amanhã."
        : "O prazo combinado termina hoje.";

  const abertura = ehLembrete
    ? `Passando para lembrar do <strong>${params.instrumentName}</strong>, que ainda está em aberto.`
    : `Para seguirmos com a sua consultoria, o próximo passo é o <strong>${params.instrumentName}</strong>.`;

  const tempo =
    params.estimatedMinutes !== null
      ? `Leva cerca de ${params.estimatedMinutes} minutos e pode ser respondido do celular.`
      : "Pode ser respondido aos poucos — dá para salvar e continuar depois.";

  return emailShell(`
    <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">Olá, ${params.clientName}!</p>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.5; color:#d4d4d8;">${abertura}</p>
    <p style="margin:0 0 24px; font-size:15px; line-height:1.5; color:#d4d4d8;">${tempo} ${prazo}</p>
    <a href="${params.url}" style="display:inline-block; background:#f59e0b; color:#09090b; font-weight:600; padding:12px 24px; border-radius:8px; text-decoration:none;">
      Responder o ${params.instrumentCode}
    </a>
    <p style="margin:24px 0 0; font-size:12px; color:#71717a;">
      Não existe resposta certa — o objetivo é retratar a sua situação como ela é. Se algo não se aplicar a você, é só deixar em branco.
    </p>
  `);
}
