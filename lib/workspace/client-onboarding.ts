import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvite } from "@/lib/workspace/invite";
import { sendEmail } from "@/lib/email/send";
import { clientInviteEmail } from "@/lib/email/templates";

/**
 * Gera um link de autenticação real do Supabase (não o nosso token de
 * `WorkspaceInvite`, que só serve para tracking/exibição) e manda pelo Brevo.
 * `type=invite` só funciona para e-mail que ainda não tem `auth.users` — é
 * exatamente o caso do pré-cadastro na primeira vez. Para reenviar depois
 * (o `auth.users` já existe, só falta a pessoa definir a senha),
 * `type=magiclink` funciona igual: estabelece sessão via `/auth/confirm`,
 * que redireciona para `/definir-senha`.
 */
async function sendInviteAuthEmail(params: {
  clientName: string;
  clientEmail: string;
  origin: string;
  type: "invite" | "magiclink";
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: params.type,
    email: params.clientEmail,
  });
  if (error) throw new ApiError(400, `Falha ao gerar link de convite: ${error.message}`);

  const inviteUrl = `${params.origin}/auth/confirm?token_hash=${data.properties.hashed_token}&type=${params.type}&next=/definir-senha`;

  await sendEmail({
    to: params.clientEmail,
    toName: params.clientName,
    subject: "Você foi convidado para o PROSPECTA Finance",
    html: clientInviteEmail({ clientName: params.clientName, inviteUrl }),
  });

  return inviteUrl;
}

/**
 * Fase 2 Etapa 4 (ARQUITETURA-IDENTIDADE-PLANOS.md §12) — admin/consultor cria
 * o registro do cliente ANTES dele existir: workspace novo (ainda sem
 * TITULAR), assinatura no plano escolhido (sempre TRIALING/sem cobrança —
 * billing real é escopo futuro), consultor já ativo como ADVISOR (se
 * indicado), e um convite pendente para o e-mail do cliente. O trigger
 * invite-aware (Etapa 1) cuida do resto: quando o cliente se cadastrar com
 * esse e-mail, entra direto nesse workspace como TITULAR em vez de ganhar um
 * workspace pessoal novo.
 *
 * O `WorkspaceInvite` precisa existir ANTES de gerar o link do Supabase —
 * `generateLink(type=invite)` cria a linha em `auth.users` na hora, o que
 * dispara o trigger de signup imediatamente; se o convite ainda não
 * existisse no banco nesse momento, o trigger não teria o que aceitar.
 */
export async function createClientPreRegistration(params: {
  clientName: string;
  clientEmail: string;
  planId: string;
  createdBy: string;
  origin: string;
  advisorProfileId?: string;
  phone?: string;
}) {
  const clientName = params.clientName.trim();
  const clientEmail = params.clientEmail.trim().toLowerCase();
  if (!clientName) throw new ApiError(400, "Informe o nome do cliente.");
  if (!clientEmail) throw new ApiError(400, "Informe o e-mail do cliente.");

  const plan = await prisma.plan.findUnique({ where: { id: params.planId } });
  if (!plan) throw new ApiError(400, "Plano inválido.");

  const workspace = await prisma.workspace.create({
    data: { name: `${clientName} (cliente)` },
  });

  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      planId: plan.id,
      status: "TRIALING",
      paymentProvider: "NONE",
    },
  });

  if (params.advisorProfileId) {
    await prisma.membership.create({
      data: { workspaceId: workspace.id, profileId: params.advisorProfileId, role: "ADVISOR" },
    });
  }

  const invite = await createInvite(workspace.id, params.createdBy, clientEmail, "TITULAR", params.phone);

  let emailSent = true;
  let inviteUrl: string;
  try {
    inviteUrl = await sendInviteAuthEmail({ clientName, clientEmail, origin: params.origin, type: "invite" });
  } catch (inviteErr) {
    // `type=invite` só funciona para e-mail que ainda não tem auth.users — se
    // a pessoa já tinha conta (ex.: já é cliente/consultor de outro
    // workspace), cai para magiclink, que funciona para qualquer e-mail já
    // cadastrado e estabelece sessão do mesmo jeito via /auth/confirm.
    try {
      inviteUrl = await sendInviteAuthEmail({ clientName, clientEmail, origin: params.origin, type: "magiclink" });
    } catch (magiclinkErr) {
      console.error("[createClientPreRegistration] falha ao enviar e-mail de convite (invite e magiclink):", {
        inviteErr,
        magiclinkErr,
      });
      emailSent = false;
      // Mesmo se o e-mail falhar, o pré-cadastro fica criado — o admin
      // consegue "reenviar" depois pela tela.
      inviteUrl = `${params.origin}/login`;
    }
  }

  return { workspace, invite, emailSent, inviteUrl };
}

/** Reenvia o convite para um pré-cadastro que já existe (link novo, e-mail novo). */
export async function resendClientInvite(workspaceId: string, origin: string) {
  const invite = await prisma.workspaceInvite.findFirst({
    where: { workspaceId, role: "TITULAR", acceptedAt: null },
    include: { workspace: true },
  });
  if (!invite) throw new ApiError(404, "Convite não encontrado ou já aceito.");

  const clientName = invite.workspace.name.replace(/ \(cliente\)$/, "");
  await sendInviteAuthEmail({ clientName, clientEmail: invite.email, origin, type: "magiclink" });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.workspaceInvite.update({ where: { id: invite.id }, data: { expiresAt } });
}

/**
 * Cancela um pré-cadastro que o cliente ainda não completou — apaga o
 * workspace inteiro (cascade cuida do convite, da subscription e da
 * membership do consultor, se houver). Recusa se já existir um TITULAR
 * (cliente já aceitou e está usando de verdade — cancelar aqui seria excluir
 * uma conta ativa, não um pré-cadastro).
 */
export async function cancelClientPreRegistration(workspaceId: string) {
  const hasOwner = await prisma.membership.findFirst({
    where: { workspaceId, role: "TITULAR", status: "ACTIVE" },
  });
  if (hasOwner) {
    throw new ApiError(400, "Esse cliente já completou o cadastro — não é mais um pré-cadastro para cancelar.");
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
}
