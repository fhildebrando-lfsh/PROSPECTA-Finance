import { prisma } from "@/lib/db/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/api/errors";
import { sendEmail } from "@/lib/email/send";
import { accountDeletedByAdminEmail } from "@/lib/email/templates";

/**
 * Exclusão de conta (self-service ou pelo admin) — apaga tudo de verdade,
 * sem meio-termo (confirmado explicitamente pelo usuário: "direito ao
 * esquecimento" da LGPD vale mais aqui do que preservar histórico).
 *
 * Passo a passo, nessa ordem (importa): primeiro descobre quais workspaces
 * essa pessoa é a ÚNICA titular ativa — esses workspaces inteiros são
 * apagados (cascade cuida de Entry/Wallet/etc., já que tudo referencia
 * Workspace com onDelete: Cascade no schema). Workspaces onde ela é
 * MEMBRO/LEITURA/ADVISOR, ou TITULAR mas com outro co-titular ativo, só
 * perdem a Membership dela, o resto do workspace continua intacto.
 * Só depois disso apaga a `Profile` (cascade cuida do resto das
 * memberships/access logs) e por último o `auth.users` — nessa ordem porque
 * se algo falhar no meio, a pessoa já perdeu acesso aos dados mais sensíveis
 * primeiro, nunca fica um `auth.users` órfão sem Profile enquanto ainda
 * consegue logar.
 */
export async function deleteAccount(profileId: string) {
  const ownedMemberships = await prisma.membership.findMany({
    where: { profileId, role: "TITULAR", status: "ACTIVE" },
    select: { workspaceId: true },
  });

  for (const { workspaceId } of ownedMemberships) {
    const otherOwner = await prisma.membership.findFirst({
      where: { workspaceId, role: "TITULAR", status: "ACTIVE", profileId: { not: profileId } },
    });
    if (!otherOwner) {
      await prisma.workspace.delete({ where: { id: workspaceId } });
    }
  }

  await prisma.profile.delete({ where: { id: profileId } });

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(profileId);
  if (error) throw new ApiError(500, `Dados apagados, mas falhou ao remover o login: ${error.message}`);
}

/** Variante usada pelo admin — avisa a pessoa por e-mail antes de apagar tudo. */
export async function deleteAccountAsAdmin(profileId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.getUserById(profileId);
  if (error || !data.user?.email) throw new ApiError(404, "Usuário não encontrado.");

  const email = data.user.email;
  await deleteAccount(profileId);

  try {
    await sendEmail({ to: email, subject: "Sua conta no PROSPECTA Finance foi excluída", html: accountDeletedByAdminEmail() });
  } catch {
    // Exclusão já aconteceu de verdade — falha no aviso não desfaz nem bloqueia, só não notifica.
  }
}
