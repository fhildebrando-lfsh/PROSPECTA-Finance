import { NextResponse, type NextRequest } from "next/server";
import { assertCanWrite, requireApiWorkspaceMembership } from "@/lib/auth/session";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { Decimal } from "@/lib/finance/types";
import { autoDetectMapping, type ColumnMapping } from "@/lib/import/column-mapping";
import { commitImportBatch } from "@/lib/import/commit";
import { parseCsvWithHeaderDetection } from "@/lib/import/parse-csv";
import { buildOfxImportRows, type OfxImportParams } from "@/lib/import/ofx-import";
import { buildPdfImportRows, type PdfImportParams } from "@/lib/import/pdf-statement/pdf-import";
import type { PdfStatementTransaction } from "@/lib/import/pdf-statement/types";

function deserializePdfTransactions(raw: unknown): PdfStatementTransaction[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => {
    const item = t as Record<string, unknown>;
    return {
      postedDate: new Date(String(item.postedDate ?? "")),
      amount: new Decimal(String(item.amount ?? "0")),
      description: String(item.description ?? ""),
      installmentNumber: typeof item.installmentNumber === "number" ? item.installmentNumber : null,
      installmentTotal: typeof item.installmentTotal === "number" ? item.installmentTotal : null,
    };
  });
}

/**
 * POST /api/import/commit — §18.1 passo 4 (ou §18 OFX): importa atomicamente as
 * linhas válidas de um lote (tudo ou nada por lote, nunca por linha — as
 * inválidas simplesmente ficam de fora). Duplicatas entram por padrão como
 * "ignoradas" (skipDuplicates=true), igual à especificação.
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, role, isPlatformAdmin, profileId } = await requireApiWorkspaceMembership();
    assertCanWrite(role, isPlatformAdmin);

    const body = await request.json();
    const isOfx = body.format === "ofx";
    const isPdf = body.format === "pdf";
    const skipDuplicates = body.skipDuplicates !== false;

    let records: Record<string, string>[];
    let mapping: ColumnMapping;
    let filename: string;

    if (isOfx) {
      const ofxText = String(body.ofxText ?? "");
      if (!ofxText.trim()) throw new ApiError(400, "Arquivo vazio.");
      const params: OfxImportParams = {
        walletId: String(body.walletId ?? ""),
        responsibleId: String(body.responsibleId ?? ""),
        fallbackCategoryDespesaId: String(body.fallbackCategoryDespesaId ?? ""),
        fallbackCategoryReceitaId: String(body.fallbackCategoryReceitaId ?? ""),
      };
      const built = await buildOfxImportRows(workspaceId, ofxText, params);
      records = built.records;
      mapping = autoDetectMapping(built.headers);
      filename = String(body.filename ?? "extrato.ofx");
    } else if (isPdf) {
      const transactions = deserializePdfTransactions(body.transactions);
      if (transactions.length === 0) throw new ApiError(400, "Nenhuma transação extraída do PDF.");
      const params: PdfImportParams = {
        walletId: String(body.walletId ?? ""),
        responsibleId: String(body.responsibleId ?? ""),
        fallbackCategoryDespesaId: String(body.fallbackCategoryDespesaId ?? ""),
        fallbackCategoryReceitaId: String(body.fallbackCategoryReceitaId ?? ""),
      };
      const built = await buildPdfImportRows(workspaceId, transactions, params);
      records = built.records;
      mapping = autoDetectMapping(built.headers);
      filename = String(body.filename ?? "fatura.pdf");
    } else {
      const csvText = String(body.csvText ?? "");
      const bodyMapping = body.mapping as ColumnMapping | undefined;
      if (!csvText.trim() || !bodyMapping) {
        throw new ApiError(400, "csvText e mapping são obrigatórios.");
      }
      ({ records } = parseCsvWithHeaderDetection(csvText));
      mapping = bodyMapping;
      filename = String(body.filename ?? "importacao.csv");
    }

    const result = await commitImportBatch({ workspaceId, profileId, records, mapping, filename, skipDuplicates });

    return NextResponse.json(result);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
