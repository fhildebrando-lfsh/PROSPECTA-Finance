import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";

export interface OrcamentoPdfRow {
  categoryName: string;
  planned: number;
  realized: number;
}

export async function buildOrcamentoPdf(
  year: number,
  monthIndex0: number,
  regimeLabel: string,
  rows: OrcamentoPdfRow[],
): Promise<Buffer> {
  const { doc, done } = startReportPdf({
    title: `Orçamento — ${MONTH_LABELS[monthIndex0]}/${year}`,
    subtitle: `Regime ${regimeLabel}`,
  });

  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const totalRealized = rows.reduce((s, r) => s + r.realized, 0);
  doc
    .fontSize(9)
    .fillColor("#111111")
    .text(`Total orçado: ${formatCurrencyBRL(totalPlanned)}   Total realizado: ${formatCurrencyBRL(totalRealized)}`);
  doc.moveDown(0.6);

  for (const r of rows) {
    const diff = r.planned - r.realized;
    const pct = r.planned > 0 ? ((r.realized / r.planned) * 100).toFixed(0) + "%" : "—";
    doc.fontSize(9).fillColor("#111111").text(r.categoryName);
    doc
      .fontSize(8)
      .fillColor(diff < 0 ? "#dc2626" : "#333333")
      .text(
        `Orçado ${formatCurrencyBRL(r.planned)} · Realizado ${formatCurrencyBRL(r.realized)} · Diferença ${formatCurrencyBRL(diff)} · ${pct} usado`,
      );
    doc.moveDown(0.4);
  }

  finishReportPdf(doc);
  return done;
}
