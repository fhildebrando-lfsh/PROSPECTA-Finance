import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { logAccess } from "@/lib/audit/access-log";

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
    // Troca de consultor: o novo entra sempre sem escrita (§3.2/5.7 do
    // ARQUITETURA-METODO-PROSPECTAR.md) — nunca herda a concessão de quem
    // ocupava a vaga antes, mesmo se for a mesma pessoa voltando.
    await prisma.membership.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", revokedAt: null, advisorCanWrite: false },
    });
  } else {
    await prisma.membership.create({ data: { workspaceId, profileId: advisorProfileId, role: "ADVISOR" } });
  }
}

/**
 * Concede ou revoga a escrita do consultor ativo de um workspace (Etapa 0,
 * 2026-08-15 — ver ARQUITETURA-METODO-PROSPECTAR.md §3.2/5.7). ADVISOR nasce
 * sempre sem escrita (`Membership.advisorCanWrite` default `false`); esta é a
 * única forma de mudar isso, e é sempre auditada — LGPD Art. 20 exige que
 * toda ação sobre dado de terceiro seja rastreável e não automática por papel.
 * Quem chama isto decide se quem está pedindo tem autoridade para pedir (hoje,
 * `/admin/usuarios`, `requireAdminProfile()` — dar esse controle direto ao
 * TITULAR do workspace, sem passar pelo admin da plataforma, é extensão
 * natural futura, não feita nesta etapa).
 */
export async function setAdvisorWriteAccess(params: {
  workspaceId: string;
  canWrite: boolean;
  actorProfileId: string;
}) {
  const advisor = await prisma.membership.findFirst({
    where: { workspaceId: params.workspaceId, role: "ADVISOR", status: "ACTIVE" },
  });
  if (!advisor) throw new ApiError(400, "Este workspace não tem consultor ativo no momento.");

  await prisma.membership.update({
    where: { id: advisor.id },
    data: { advisorCanWrite: params.canWrite },
  });

  // `actorRole` aqui identifica que este registro é sobre a relação de
  // ADVISOR do workspace, não necessariamente o papel de quem executou a
  // ação (hoje sempre platform admin, sem Membership própria neste
  // workspace — MembershipRole não tem valor pra "admin externo"). Mesma
  // leitura que `AccessLog.actorRole` já recebe nos registros de
  // VIEW_WORKSPACE, onde actorRole é sempre "ADVISOR" mesmo que o ator seja
  // quem está sendo observado, não quem concedeu o acesso.
  await logAccess({
    actorProfileId: params.actorProfileId,
    workspaceId: params.workspaceId,
    actorRole: "ADVISOR",
    action: params.canWrite ? "GRANT_ADVISOR_WRITE" : "REVOKE_ADVISOR_WRITE",
  });
}
