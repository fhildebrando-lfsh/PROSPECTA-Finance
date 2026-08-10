import { after } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { ColumnMapping } from "@/lib/import/column-mapping";
import { clusterInstallmentRows } from "@/lib/import/group-installments";
import { hasErrors, parseImportRow } from "@/lib/import/parse-row";
import { buildReferenceMaps, resolveRow } from "@/lib/import/resolve";
import { syncEntryToGoogleCalendar } from "@/lib/integrations/google-calendar/sync";

export interface CommitImportInput {
  workspaceId: string;
  profileId: string;
  records: Record<string, string>[];
  mapping: ColumnMapping;
  filename: string;
  skipDuplicates: boolean;
}

export interface CommitImportResult {
  batchId: string;
  imported: number;
  skipped: number;
}

/**
 * §18.1 passo 4 (ou §18 OFX) — núcleo transacional do commit de importação:
 * importa atomicamente as linhas válidas de um lote (tudo ou nada por lote,
 * nunca por linha — as inválidas simplesmente ficam de fora). Duplicatas
 * entram por padrão como "ignoradas" (skipDuplicates=true). Extraído de
 * app/api/import/commit/route.ts pra ser testável direto, mesmo espírito de
 * lib/import/revert.ts — a rota continua responsável só por decidir o
 * formato (CSV/OFX/PDF) e montar records/mapping antes de chamar isto.
 */
export async function commitImportBatch(input: CommitImportInput): Promise<CommitImportResult> {
  const { workspaceId, profileId, records, mapping, filename, skipDuplicates } = input;

  const refs = await buildReferenceMaps(workspaceId);
  const seenKeysInBatch = new Set<string>();

  const resolvedRows = records.map((raw) => resolveRow(parseImportRow(raw, mapping), refs, seenKeysInBatch));
  const toImport = resolvedRows.filter((row) => !hasErrors(row.parsed) && !(row.isDuplicate && skipDuplicates));

  // §8.4 — group_id é sempre atribuído automaticamente, nunca digitado, mesmo
  // quando o lançamento vem de importação.
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
          autoReviewReason: row.parsed.data.reviewReason,
          importedDescription: row.parsed.data.importedDescription,
          importBatchId: created.id,
          createdBy: profileId,
          updatedBy: profileId,
        })),
      });
    }

    return created;
  });

  if (toImport.length > 0) {
    after(async () => {
      const imported = await prisma.entry.findMany({ where: { importBatchId: batch.id }, select: { id: true } });
      await Promise.all(imported.map((entry) => syncEntryToGoogleCalendar(entry.id)));
    });
  }

  return { batchId: batch.id, imported: toImport.length, skipped: resolvedRows.length - toImport.length };
}
