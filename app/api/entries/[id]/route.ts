import { after, NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { parseIsoDate, updateEntrySchema } from "@/lib/validation/entry";
import { Decimal } from "@/lib/finance/types";
import { deleteEntryGoogleCalendarEvent, syncEntryToGoogleCalendar } from "@/lib/integrations/google-calendar/sync";
import type { Prisma } from "@/app/generated/prisma/client";

async function loadOwnedEntry(id: string, workspaceId: string) {
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry || entry.workspaceId !== workspaceId) {
    throw new ApiError(404, "Lançamento não encontrado.");
  }
  return entry;
}

/** PATCH /api/entries/:id — edição de um lançamento (§17). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { workspaceId, role, isPlatformAdmin, profileId } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);
    await loadOwnedEntry(id, workspaceId);

    const body = await request.json();
    const input = updateEntrySchema.parse(body);

    const data: Prisma.EntryUpdateInput = { updatedBy: profileId };
    if (input.walletId !== undefined) data.wallet = { connect: { id: input.walletId } };
    if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
    if (input.subcategoryId !== undefined) {
      data.subcategory = input.subcategoryId ? { connect: { id: input.subcategoryId } } : { disconnect: true };
    }
    if (input.responsibleId !== undefined) data.responsible = { connect: { id: input.responsibleId } };
    if (input.nature !== undefined) data.nature = input.nature;
    if (input.amount !== undefined) data.amount = new Decimal(input.amount);
    if (input.description !== undefined) data.description = input.description;
    if (input.transactionDate !== undefined) data.transactionDate = parseIsoDate(input.transactionDate);
    if (input.dueDate !== undefined) data.dueDate = parseIsoDate(input.dueDate);
    if (input.statusCode !== undefined) data.status = { connect: { code: input.statusCode } };
    if (input.recurrenceCode !== undefined) data.recurrence = { connect: { code: input.recurrenceCode } };
    if (input.installmentNumber !== undefined) data.installmentNumber = input.installmentNumber;
    if (input.note !== undefined) data.note = input.note;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.isFixedOverride !== undefined) data.isFixedOverride = input.isFixedOverride;

    const updated = await prisma.entry.update({ where: { id }, data });
    after(() => syncEntryToGoogleCalendar(updated.id));
    return NextResponse.json({ entry: updated });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", details: err.issues }, { status: 400 });
    }
    return apiErrorResponse(err);
  }
}

/** DELETE /api/entries/:id — excluir uma linha de transferência exclui as duas (§10 R5). */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { workspaceId, role, isPlatformAdmin } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);
    const existing = await loadOwnedEntry(id, workspaceId);

    let deleted: { googleEventId: string | null }[];
    if (existing.transferId) {
      deleted = await prisma.entry.findMany({
        where: { workspaceId, transferId: existing.transferId },
        select: { googleEventId: true },
      });
      await prisma.entry.deleteMany({ where: { workspaceId, transferId: existing.transferId } });
    } else {
      deleted = [existing];
      await prisma.entry.delete({ where: { id } });
    }

    const eventIds = deleted.map((e) => e.googleEventId).filter((v): v is string => Boolean(v));
    if (eventIds.length > 0) {
      after(() => Promise.all(eventIds.map((eventId) => deleteEntryGoogleCalendarEvent(workspaceId, eventId))));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
