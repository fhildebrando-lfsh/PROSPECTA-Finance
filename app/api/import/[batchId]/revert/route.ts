import { NextResponse, type NextRequest } from "next/server";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { apiErrorResponse } from "@/lib/api/errors";
import { revertImportBatch } from "@/lib/import/revert";

/**
 * POST /api/import/:batchId/revert — §18.1: revertível com 1 clique
 * enquanto nenhum lançamento do lote tiver sido editado depois.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ batchId: string }> }) {
  try {
    const { batchId } = await params;
    const { workspaceId, role, isPlatformAdmin, advisorCanWrite } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

    await revertImportBatch(batchId, workspaceId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
