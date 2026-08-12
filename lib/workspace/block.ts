import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { WorkspaceBlockReason } from "@/app/generated/prisma/enums";

export interface BlockWorkspaceInput {
  workspaceId: string;
  reason: WorkspaceBlockReason;
  /** Obrigatório só quando `reason === "OUTRO"` — vira a mensagem exata mostrada ao cliente. */
  detail: string | null;
  blockedBy: string;
}

/** Bloqueia o acesso de todo mundo que acessa este workspace (titular, membros,
 * consultor) — alternativa reversível a excluir a conta do cliente, ver
 * `lib/auth/session.ts::requireActiveMembership`. */
export async function blockWorkspace(input: BlockWorkspaceInput) {
  if (input.reason === "OUTRO" && !input.detail?.trim()) {
    throw new ApiError(400, 'Escreva a mensagem que o cliente vai ver, já que o motivo é "Outro".');
  }

  await prisma.workspace.update({
    where: { id: input.workspaceId },
    data: {
      blockedAt: new Date(),
      blockedReason: input.reason,
      blockedDetail: input.reason === "OUTRO" ? input.detail!.trim() : null,
      blockedBy: input.blockedBy,
    },
  });
}

/** Desbloqueia — zera os 4 campos, sem tabela de histórico separada (mesmo espírito leve
 * de `Entitlement.reason`/`grantedBy`). */
export async function unblockWorkspace(workspaceId: string) {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { blockedAt: null, blockedReason: null, blockedDetail: null, blockedBy: null },
  });
}
