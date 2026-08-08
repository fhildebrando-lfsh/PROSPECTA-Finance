import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL } from "@/lib/format";
import type { Decimal } from "@/lib/finance/types";

export interface BensPdfRow {
  name: string;
  categoryName: string;
  currentValue: Decimal;
  isActive: boolean;
}

export async function buildBensPdf(totalPatrimony: Decimal, rows: BensPdfRow[]): Promise<Buffer> {
  const { doc, done } = startReportPdf({ title: "Patrimônio — Bens" });

  doc.fontSize(10).fillColor("#111111").text(`Patrimônio total (bens ativos): ${formatCurrencyBRL(totalPatrimony)}`);
  doc.moveDown(0.6);

  if (rows.length === 0) {
    doc.fontSize(9).fillColor("#000000").text("Nenhum bem cadastrado.");
  }

  for (const r of rows) {
    doc.fontSize(9).fillColor(r.isActive ? "#111111" : "#999999").text(
      `${r.name}${r.isActive ? "" : " (arquivado)"} — ${r.categoryName} — ${formatCurrencyBRL(r.currentValue)}`,
    );
    doc.moveDown(0.3);
  }

  finishReportPdf(doc);
  return done;
}
