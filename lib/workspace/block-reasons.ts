import type { WorkspaceBlockReason } from "@/app/generated/prisma/enums";

// Módulo separado de `lib/workspace/block.ts` DE PROPÓSITO — este aqui não importa
// `prisma` (que puxa o driver `pg`, Node-only) porque `BlockAccessControl.tsx` (Client
// Component) precisa destes rótulos. Mesmo cuidado já documentado nesta sessão pra
// `lib/finance/investment-instruments.ts`/`InvestmentHistoryRow.tsx`.

/** Rótulo do motivo, usado no `<select>` do admin (`BlockAccessControl.tsx`) e no status
 * exibido ao lado de cada workspace bloqueado em `/admin/usuarios`. */
export const BLOCK_REASON_LABELS: Record<WorkspaceBlockReason, string> = {
  FATURA_EM_ABERTO: "Fatura em aberto",
  SOLICITACAO_DO_CLIENTE: "Solicitação do próprio cliente",
  VERIFICACAO_DE_SEGURANCA: "Verificação de segurança",
  ORIENTACAO_DO_CONSULTOR: "Orientação do consultor",
  AGUARDANDO_APROVACAO: "Aguardando aprovação",
  OUTRO: "Outro motivo",
};

/** Motivos que o admin pode escolher manualmente ao bloquear alguém em
 * `BlockAccessControl.tsx` — `AGUARDANDO_APROVACAO` fica de fora de propósito: só o
 * próprio trigger de signup grava esse valor (ver `prisma/sql/010_self_signup_requires_approval.sql`),
 * nunca uma escolha manual do admin. */
export const MANUAL_BLOCK_REASONS = [
  "FATURA_EM_ABERTO",
  "SOLICITACAO_DO_CLIENTE",
  "VERIFICACAO_DE_SEGURANCA",
  "ORIENTACAO_DO_CONSULTOR",
  "OUTRO",
] as const satisfies readonly WorkspaceBlockReason[];

/** Mensagem mostrada ao cliente bloqueado em `/acesso-bloqueado`, uma por motivo — exceto
 * `OUTRO`, que usa o texto livre escrito pelo admin (`Workspace.blockedDetail`) em vez de
 * uma mensagem fixa daqui. */
export const BLOCK_REASON_MESSAGES: Record<Exclude<WorkspaceBlockReason, "OUTRO">, string> = {
  FATURA_EM_ABERTO:
    "Seu acesso foi pausado devido a uma fatura em aberto. Vamos resolver isso juntos? Atualize o seu pagamento ou fale com a nossa equipe.",
  SOLICITACAO_DO_CLIENTE:
    "Seu acesso foi pausado a seu pedido. Quando quiser reativá-lo, entre em contato com o administrador do sistema.",
  VERIFICACAO_DE_SEGURANCA:
    "Seu acesso foi pausado para uma verificação de segurança. Entre em contato com o administrador do sistema.",
  ORIENTACAO_DO_CONSULTOR: "Seu acesso foi pausado. Entre em contato com o seu consultor.",
  AGUARDANDO_APROVACAO:
    "Sua conta foi criada e está aguardando aprovação do administrador. Você será avisado assim que liberarmos seu acesso.",
};
