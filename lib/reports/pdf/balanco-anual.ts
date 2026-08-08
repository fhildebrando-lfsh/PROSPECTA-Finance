import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";
import type { Decimal } from "@/lib/finance/types";

export interface BalancoAnualPdfRow {
  label: string;
  values: Decimal[];
  total: Decimal;
}

export interface BalancoAnualCategoryRow {
  categoryName: string;
  monthly: Decimal[];
  total: Decimal;
}

export async function buildBalancoAnualPdf(
  year: number,
  regimeLabel: string,
  syntheticRows: BalancoAnualPdfRow[],
  categoryRows: BalancoAnualCategoryRow[],
): Promise<Buffer> {
  const { doc, done } = startReportPdf({
    title: `Balanço anual — ${year}`,
    subtitle: `Regime ${regimeLabel}`,
  });

  doc.fontSize(11).fillColor("#111111").text("Sintético");
  doc.moveDown(0.3);
  for (const row of syntheticRows) {
    doc.fontSize(10).fillColor("#111111").text(row.label);
    doc.fontSize(8).fillColor("#333333").text(MONTH_LABELS.map((m, i) => `${m} ${formatCurrencyBRL(row.values[i])}`).join("   "));
    doc.fontSize(9).fillColor("#000000").text(`Total: ${formatCurrencyBRL(row.total)}`);
    doc.moveDown(0.6);
  }

  doc.moveDown(0.6);
  doc.fontSize(11).fillColor("#111111").text("Descritivo por categoria (despesas)");
  doc.moveDown(0.3);
  if (categoryRows.length === 0) {
    doc.fontSize(9).fillColor("#000000").text("Sem despesas no ano.");
  }
  for (const row of categoryRows) {
    doc.fontSize(9).fillColor("#111111").text(`${row.categoryName} — total: ${formatCurrencyBRL(row.total)}`);
    doc.fontSize(7.5).fillColor("#666666").text(
      MONTH_LABELS.map((m, i) => `${m} ${row.monthly[i].isZero() ? "—" : formatCurrencyBRL(row.monthly[i])}`).join("   "),
    );
    doc.moveDown(0.4);
  }

  finishReportPdf(doc);
  return done;
}
