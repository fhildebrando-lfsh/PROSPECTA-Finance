import { parse } from "csv-parse/sync";
import { slugify } from "@/lib/slug";
import { KNOWN_HEADER_SLUGS } from "./column-mapping";

const MIN_HEADER_MATCHES = 3;
const MAX_ROWS_TO_SCAN = 10;

export interface ParsedCsv {
  headers: string[];
  records: Record<string, string>[];
  /** > 0 quando linhas antes do cabeçalho foram descartadas (ex.: exports do Sheets com uma linha de resumo antes da tabela). */
  skippedRows: number;
}

/**
 * §18.1 — alguns exports (o do Google Sheets, no caso real que motivou isto)
 * trazem uma linha de resumo/lixo antes da linha de cabeçalho de verdade.
 * Em vez de assumir sempre que a linha 1 é o cabeçalho, procura nas
 * primeiras linhas a primeira que bate com pelo menos `MIN_HEADER_MATCHES`
 * nomes conhecidos (§18.1 passo 2) e usa essa como cabeçalho.
 */
export function parseCsvWithHeaderDetection(csvText: string): ParsedCsv {
  const rawRows: string[][] = parse(csvText, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  if (rawRows.length === 0) {
    return { headers: [], records: [], skippedRows: 0 };
  }

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rawRows.length, MAX_ROWS_TO_SCAN); i++) {
    const matches = rawRows[i].filter((cell) => KNOWN_HEADER_SLUGS.has(slugify(cell))).length;
    if (matches >= MIN_HEADER_MATCHES) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = rawRows[headerRowIndex].map((header, i) => header.trim() || `coluna_${i + 1}`);
  const records = rawRows.slice(headerRowIndex + 1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = (cells[i] ?? "").trim();
    });
    return record;
  });

  return { headers, records, skippedRows: headerRowIndex };
}
