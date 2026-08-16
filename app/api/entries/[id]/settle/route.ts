import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse } from "@/lib/api/errors";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { settleEntry } from "@/lib/entries/settle";

/** PATCH /api/entries/:id/settle — marcar pago/recebido em 1 toque (§13 Compromissos). */
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { workspaceId, role, isPlatformAdmin, profileId } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const updated = await settleEntry(id, workspaceId, profileId);
    return NextResponse.json({ entry: updated });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
