import { NextResponse, type NextRequest } from "next/server";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import type { ColumnMapping } from "@/lib/import/column-mapping";
import { clusterInstallmentRows } from "@/lib/import/group-installments";
import { parseCsvWithHeaderDetection } from "@/lib/import/parse-csv";
import { hasErrors, parseImportRow } from "@/lib/import/parse-row";
import { buildReferenceMaps, resolveRow } from "@/lib/import/resolve";

/**
 * POST /api/import/commit — §18.1 passo 4: importa atomicamente as linhas
 * válidas de um lote (tudo ou nada por lote, nunca por linha — as inválidas
 * simplesmente ficam de fora). Duplicatas entram por padrão como
 * "ignoradas" (skipDuplicates=true), igual à especificação.
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, role, isPlatformAdmin, profileId } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const body = await request.json();
    const csvText = String(body.csvText ?? "");
    const mapping = body.mapping as ColumnMapping | undefined;
    const skipDuplicates = body.skipDuplicates !== false;
    const filename = String(body.filename ?? "importacao.csv");

    if (!csvText.trim() || !mapping) {
      throw new ApiError(400, "csvText e mapping são obrigatórios.");
    }

    const { records } = parseCsvWithHeaderDetection(csvText);

    const refs = await buildReferenceMaps(workspaceId);
    const seenKeysInBatch = new Set<string>();

    const resolvedRows = records.map((raw) => resolveRow(parseImportRow(raw, mapping), refs, seenKeysInBatch));

    const toImport = resolvedRows.filter((row) => !hasErrors(row.parsed) && !(row.isDuplicate && skipDuplicates));

    // §8.4 — group_id é sempre atribuído automaticamente, nunca digitado, mesmo
    // quando o lançamento vem de importação (antes disso, toda linha parcelada
    // importada ficava para sempre sem groupId — bug real que deixava "Despesas
    // parceladas" e "Dívidas" cegos para dado importado; ver
    // lib/import/group-installments.ts e scripts/backfill-installment-groups.ts
    // para o retroativo).
    const { safe: safeClusters } = clusterInstallmentRows(
      toImport.map((row) => ({
        row,
        walletId: row.walletId!,
        categoryId: row.categoryId!,
        description: row.parsed.data.description!,
        installmentNumber: row.parsed.data.recurrence!.installmentNumber,
        installmentTotal: row.parsed.data.recurrence!.installmentTotal,
        amount: row.parsed.data.amount!,
      })),
    );

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.importBatch.create({
        data: {
          workspaceId,
          originalFilename: filename,
          importedCount: toImport.length,
          errorCount: resolvedRows.length - toImport.length,
          createdBy: profileId,
        },
      });

      const groupIdByRow = new Map<(typeof toImport)[number], string>();
      for (const cluster of safeClusters) {
        if (cluster.length < 2) continue; // parcela avulsa sozinha não precisa de grupo
        const group = await tx.entryGroup.create({ data: { workspaceId } });
        for (const item of cluster) groupIdByRow.set(item.row, group.id);
      }

      if (toImport.length > 0) {
        await tx.entry.createMany({
          data: toImport.map((row) => ({
            workspaceId,
            walletId: row.walletId!,
            categoryId: row.categoryId!,
            subcategoryId: row.subcategoryId,
            responsibleId: row.responsibleId!,
            nature: row.parsed.data.nature!,
            amount: row.parsed.data.amount!,
            description: row.parsed.data.description!,
            transactionDate: row.parsed.data.transactionDate!,
            dueDate: row.parsed.data.dueDate!,
            statusCode: row.parsed.data.statusCode!,
            recurrenceCode: row.parsed.data.recurrence!.recurrenceKind,
            groupId: groupIdByRow.get(row) ?? null,
            installmentNumber: row.parsed.data.recurrence!.installmentNumber,
            installmentTotal: row.parsed.data.recurrence!.installmentTotal,
            isPatrimonio: row.parsed.data.recurrence!.isPatrimonio,
            isProjecao: row.parsed.data.recurrence!.isProjecao,
            legacyRecurrenceLabel: row.parsed.data.recurrence!.legacyLabel,
            note: row.parsed.data.note,
            tags: row.parsed.data.tags,
            importBatchId: created.id,
            createdBy: profileId,
            updatedBy: profileId,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({
      batchId: batch.id,
      imported: toImport.length,
      skipped: resolvedRows.length - toImport.length,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
