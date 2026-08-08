import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";
import type { Decimal } from "@/lib/finance/types";

export interface AnaliticoPdfRow {
  label: string;
  values: Decimal[];
  total: Decimal;
}

export async function buildAnaliticoPdf(year: number, regimeLabel: string, rows: AnaliticoPdfRow[]): Promise<Buffer> {
  const { doc, done } = startReportPdf({
    title: `Analítico mês a mês — ${year}`,
    subtitle: `Regime ${regimeLabel}`,
  });

  for (const row of rows) {
    doc.fontSize(10).fillColor("#111111").text(row.label);
    doc.fontSize(8).fillColor("#333333").text(MONTH_LABELS.map((m, i) => `${m} ${formatCurrencyBRL(row.values[i])}`).join("   "));
    doc.fontSize(9).fillColor("#000000").text(`Total: ${formatCurrencyBRL(row.total)}`);
    doc.moveDown(0.7);
  }

  finishReportPdf(doc);
  return done;
}
