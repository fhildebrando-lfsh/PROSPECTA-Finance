import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";

/**
 * §18.1 — reverte um lote importado, bloqueado se algum lançamento do lote
 * foi editado depois da importação. Compartilhado entre a API
 * (/api/import/:batchId/revert) e a Server Action da tela de Importar.
 */
export async function revertImportBatch(batchId: string, workspaceId: string) {
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
}
