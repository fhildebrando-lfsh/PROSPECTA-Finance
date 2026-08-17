import { requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { DELIVERABLES, type DeliverableContent } from "@/lib/method/deliverables/catalog";
import { buildEntregavelPdf } from "@/lib/reports/pdf/entregavel";
import { pdfResponse } from "@/lib/reports/pdf-response";

/**
 * Etapa 9 — PDF de um artefato do método. O cliente pode baixar (é dele), mas
 * o gate de método vale aqui também: sem contrato ativo, nem a rota responde.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireApiWorkspaceMembership();
    if (!(await hasFeature(workspaceId, "entregaveis"))) {
      throw new ApiError(403, "Entregáveis do método exigem consultoria ativa.");
    }

    const { id } = await params;
    const deliverable = await prisma.deliverable.findFirst({ where: { id, workspaceId } });
    if (!deliverable) throw new ApiError(404, "Entregável não encontrado.");

    const spec = DELIVERABLES[deliverable.code];
    const buffer = await buildEntregavelPdf({
      codigo: deliverable.code,
      nome: spec.name,
      proposito: spec.purpose,
      versao: deliverable.version,
      status: deliverable.status,
      criadoEm: deliverable.createdAt,
      validadoEm: deliverable.validatedAt,
      content: deliverable.content as unknown as DeliverableContent,
      nomeNaoConfirmado: !spec.nameConfirmed,
    });

    return pdfResponse(buffer, `${deliverable.code.toLowerCase()}-v${deliverable.version}.pdf`);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
