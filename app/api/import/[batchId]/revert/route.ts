import { NextResponse, type NextRequest } from "next/server";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/import/:batchId/revert — §18.1: revertível com 1 clique
 * enquanto nenhum lançamento do lote tiver sido editado depois.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await params;
    const { workspaceId, role, isPlatformAdmin } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const batch = await prisma.importBatch.findUnique({
      where: { id: batchId },
      include: { entries: { select: { createdAt: true, updatedAt: true } } },
    });

    if (!batch || batch.workspaceId !== workspaceId) {
      throw new ApiError(404, "Lote não encontrado.");
    }
    if (batch.revertedAt) {
      throw new ApiError(400, "Este lote já foi revertido.");
    }

    const wasEditedAfterImport = batch.entries.some((e) => e.updatedAt.getTime() !== e.createdAt.getTime());
    if (wasEditedAfterImport) {
      throw new ApiError(
        400,
        "Um ou mais lançamentos deste lote foram editados depois da importação — não é possível reverter automaticamente.",
      );
    }

    await prisma.$transaction([
      prisma.entry.deleteMany({ where: { importBatchId: batchId } }),
      prisma.importBatch.update({ where: { id: batchId }, data: { revertedAt: new Date() } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
