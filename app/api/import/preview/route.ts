import { NextResponse, type NextRequest } from "next/server";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { autoDetectMapping, missingRequiredFields, type ColumnMapping } from "@/lib/import/column-mapping";
import { parseCsvWithHeaderDetection } from "@/lib/import/parse-csv";
import { hasErrors, parseImportRow } from "@/lib/import/parse-row";
import { buildReferenceMaps, resolveRow } from "@/lib/import/resolve";

/**
 * POST /api/import/preview — §18.1 passos 2 e 3: propõe/recebe o
 * mapeamento de colunas e valida linha a linha, sem gravar nada.
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, role, isPlatformAdmin } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const body = await request.json();
    const csvText = String(body.csvText ?? "");
    if (!csvText.trim()) throw new ApiError(400, "Arquivo vazio.");

    const { headers, records, skippedRows } = parseCsvWithHeaderDetection(csvText);

    const mapping: ColumnMapping = body.mapping ?? autoDetectMapping(headers);
    const missing = missingRequiredFields(mapping);

    let rows;
    if (missing.length > 0) {
      // sem mapeamento completo ainda não dá para validar existência/duplicata
      rows = records.map((raw, index) => {
        const parsed = parseImportRow(raw, mapping);
        return { index, raw, issues: parsed.issues, hasError: true, isDuplicate: false };
      });
    } else {
      const refs = await buildReferenceMaps(workspaceId);
      const seenKeysInBatch = new Set<string>();
      rows = records.map((raw, index) => {
        const parsed = parseImportRow(raw, mapping);
        const resolved = resolveRow(parsed, refs, seenKeysInBatch);
        return {
          index,
          raw,
          issues: resolved.parsed.issues,
          hasError: hasErrors(resolved.parsed),
          isDuplicate: resolved.isDuplicate,
        };
      });
    }

    const summary = {
      total: rows.length,
      errors: rows.filter((r) => r.hasError).length,
      warnings: rows.filter((r) => r.issues.some((i) => i.severity === "aviso")).length,
      duplicates: rows.filter((r) => r.isDuplicate).length,
      importable: rows.filter((r) => !r.hasError).length,
    };

    return NextResponse.json({ headers, mapping, missingRequiredFields: missing, rows, summary, skippedRows });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
