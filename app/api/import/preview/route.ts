import { NextResponse, type NextRequest } from "next/server";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { autoDetectMapping, missingRequiredFields, type ColumnMapping } from "@/lib/import/column-mapping";
import { parseCsvWithHeaderDetection } from "@/lib/import/parse-csv";
import { buildOfxImportRows } from "@/lib/import/ofx-import";
import { hasErrors, parseImportRow } from "@/lib/import/parse-row";
import { buildReferenceMaps, resolveRow } from "@/lib/import/resolve";

/**
 * POST /api/import/preview — §18.1 passos 2 e 3 (ou §18 OFX, sem mapeamento de
 * coluna nenhum — carteira/responsável/categorias padrão vêm no lugar): propõe/
 * recebe o mapeamento e valida linha a linha, sem gravar nada.
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, role, isPlatformAdmin } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const body = await request.json();
    const isOfx = body.format === "ofx";

    let headers: string[];
    let records: Record<string, string>[];
    let skippedRows: number;

    if (isOfx) {
      const ofxText = String(body.ofxText ?? "");
      if (!ofxText.trim()) throw new ApiError(400, "Arquivo vazio.");
      ({ headers, records, skippedRows } = await buildOfxImportRows(workspaceId, ofxText, {
        walletId: String(body.walletId ?? ""),
        responsibleId: String(body.responsibleId ?? ""),
        fallbackCategoryDespesaId: String(body.fallbackCategoryDespesaId ?? ""),
        fallbackCategoryReceitaId: String(body.fallbackCategoryReceitaId ?? ""),
      }));
    } else {
      const csvText = String(body.csvText ?? "");
      if (!csvText.trim()) throw new ApiError(400, "Arquivo vazio.");
      ({ headers, records, skippedRows } = parseCsvWithHeaderDetection(csvText));
    }

    const mapping: ColumnMapping = isOfx ? autoDetectMapping(headers) : (body.mapping ?? autoDetectMapping(headers));
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
