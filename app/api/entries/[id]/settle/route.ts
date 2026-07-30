import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";

/** PATCH /api/entries/:id/settle — marcar pago/recebido em 1 toque (§13 Compromissos). */
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { workspaceId, role, isPlatformAdmin, profileId } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const existing = await prisma.entry.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== workspaceId) {
      throw new ApiError(404, "Lançamento não encontrado.");
    }

    let nextStatus: string;
    if (existing.statusCode === "A_PAGAR") nextStatus = "PAGO";
    else if (existing.statusCode === "A_RECEBER") nextStatus = "RECEBIDO";
    else {
      throw new ApiError(
        400,
        `Situação "${existing.statusCode}" não é liquidável por este atalho (só A_PAGAR/A_RECEBER).`,
      );
    }

    const updated = await prisma.entry.update({
      where: { id },
      data: { statusCode: nextStatus, settledAt: new Date(), updatedBy: profileId },
    });

    return NextResponse.json({ entry: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
