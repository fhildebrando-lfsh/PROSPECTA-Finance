import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";

/**
 * Atribui/troca/remove o consultor (`ADVISOR`) de um workspace — funciona
 * para qualquer workspace com titular, não só os criados via pré-cadastro
 * (`/admin/clientes`); um workspace pessoal comum pode virar cliente de
 * consultoria depois, a qualquer momento, sem precisar ter nascido assim.
 *
 * Troca de consultor nunca apaga a relação anterior — revoga
 * (`status=REVOKED`), igual a arquitetura já faz para qualquer acesso de
 * ADVISOR (histórico de auditoria: "esse consultor teve acesso entre X e
 * Y"). `advisorProfileId=null` só remove o consultor atual, sem atribuir
 * um novo.
 */
export async function assignAdvisor(workspaceId: string, advisorProfileId: string | null) {
  const currentAdvisors = await prisma.membership.findMany({
    where: { workspaceId, role: "ADVISOR", status: "ACTIVE" },
  });

  await prisma.$transaction(
    currentAdvisors.map((m) =>
      prisma.membership.update({ where: { id: m.id }, data: { status: "REVOKED", revokedAt: new Date() } }),
    ),
  );

  if (!advisorProfileId) return;

  const existing = await prisma.membership.findUnique({
    where: { workspaceId_profileId: { workspaceId, profileId: advisorProfileId } },
  });

  if (existing) {
    if (existing.role !== "ADVISOR") {
      throw new ApiError(
        400,
        "Essa pessoa já é membro desse workspace com outro papel — não é possível torná-la consultora por aqui.",
      );
    }
    await prisma.membership.update({ where: { id: existing.id }, data: { status: "ACTIVE", revokedAt: null } });
  } else {
    await prisma.membership.create({ data: { workspaceId, profileId: advisorProfileId, role: "ADVISOR" } });
  }
}
