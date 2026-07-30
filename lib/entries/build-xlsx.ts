import ExcelJS from "exceljs";
import { EXPORT_HEADERS, type ExportRow } from "./export-row";

const DATE_COLUMNS = new Set(["Compra", "Vence"]);
const NUMBER_COLUMNS = new Set(["Valor"]);

function parseBrDateForExcel(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
}

function parseBrlAmountForExcel(value: string): number | null {
  const cleaned = value.replace(/R\$\s*/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

/**
 * §18.2 — XLSX "formatada": valores como número (não texto), datas como
 * data, moeda em R$ #.##0,00, cabeçalho congelado e filtro automático.
 */
export async function buildXlsx(rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Lançamentos", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = EXPORT_HEADERS.map((header) => ({ header, key: header, width: 18 }));

  for (const row of rows) {
    const excelRow: Record<string, string | number | Date> = {};
    for (const header of EXPORT_HEADERS) {
      const raw = row[header];
      if (DATE_COLUMNS.has(header)) {
        excelRow[header] = parseBrDateForExcel(raw) ?? raw;
      } else if (NUMBER_COLUMNS.has(header)) {
        const num = parseBrlAmountForExcel(raw);
        excelRow[header] = num ?? raw;
      } else {
        excelRow[header] = raw;
      }
    }
    sheet.addRow(excelRow);
  }

  sheet.getColumn("Compra").numFmt = "dd/mm/yyyy";
  sheet.getColumn("Vence").numFmt = "dd/mm/yyyy";
  sheet.getColumn("Valor").numFmt = "R$ #,##0.00";

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: EXPORT_HEADERS.length } };
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
