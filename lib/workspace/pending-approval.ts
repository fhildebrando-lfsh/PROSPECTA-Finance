import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { pendingApprovalNotificationEmail } from "@/lib/email/templates";

/**
 * Avisa todo admin da plataforma por e-mail quando um workspace nasce
 * `blockedReason = AGUARDANDO_APROVACAO` (autocadastro sem convite — ver
 * `prisma/sql/010_self_signup_requires_approval.sql`). Idempotente via
 * `Workspace.adminNotifiedAt` — chamado de dois lugares (`app/(auth)/login/actions.ts`
 * pro cadastro por e-mail/senha, `app/auth/confirm/route.ts` pro primeiro login via
 * Google), então não pode reenviar a cada tentativa de acesso de quem ainda não foi
 * aprovado.
 *
 * Busca os admins dinamicamente (`Profile.isPlatformAdmin`) em vez de um e-mail fixo em
 * variável de ambiente — funciona sozinho se mais admins forem promovidos depois.
 */
export async function notifyAdminsOfPendingApproval(workspaceId: string, origin: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { memberships: { where: { role: "TITULAR" }, include: { profile: true } } },
  });
  if (!workspace) return;
  if (workspace.blockedReason !== "AGUARDANDO_APROVACAO") return;
  if (workspace.adminNotifiedAt) return; // já avisado — evita reenviar a cada tentativa de login

  const titular = workspace.memberships[0]?.profile;
  if (!titular) return;

  const admins = await prisma.profile.findMany({ where: { isPlatformAdmin: true } });
  if (admins.length === 0) return;

  const supabase = createAdminClient();
  const { data: authData, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) return; // não deixa a falha de notificação quebrar o fluxo de cadastro

  const emailByProfileId = new Map(authData.users.map((u) => [u.id, u.email ?? null]));
  const personEmail = emailByProfileId.get(titular.id) ?? "(e-mail não encontrado)";

  const html = pendingApprovalNotificationEmail({
    personName: titular.fullName ?? "(sem nome)",
    personEmail,
    adminUrl: `${origin}/admin/usuarios`,
  });

  await Promise.all(
    admins.map((admin) => {
      const adminEmail = emailByProfileId.get(admin.id);
      if (!adminEmail) return Promise.resolve();
      return sendEmail({
        to: adminEmail,
        toName: admin.fullName ?? undefined,
        subject: "Novo cadastro aguardando aprovação — PROSPECTA Finance",
        html,
      }).catch(() => {}); // um admin com e-mail inválido não deve impedir os outros
    }),
  );

  await prisma.workspace.update({ where: { id: workspaceId }, data: { adminNotifiedAt: new Date() } });
}
