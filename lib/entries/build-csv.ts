import { EXPORT_HEADERS, type ExportRow } from "./export-row";

function escapeCsvCell(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * §18.3 — CSV para abrir no Excel em português: UTF-8 com BOM e separador
 * `;` (sem isso o Excel lê acento errado e junta tudo numa coluna só).
 */
export function buildCsv(rows: ExportRow[]): string {
  const delimiter = ";";
  const lines = [
    EXPORT_HEADERS.map((h) => escapeCsvCell(h, delimiter)).join(delimiter),
    ...rows.map((row) => EXPORT_HEADERS.map((h) => escapeCsvCell(row[h], delimiter)).join(delimiter)),
  ];
  return "﻿" + lines.join("\r\n");
}
