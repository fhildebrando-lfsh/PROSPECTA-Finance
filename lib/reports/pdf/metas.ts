import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import type { Decimal } from "@/lib/finance/types";

export interface MetasPdfRow {
  name: string;
  walletName: string;
  balance: Decimal;
  targetAmount: Decimal;
  targetDate: Date | null;
  progress: Decimal;
  isActive: boolean;
}

export async function buildMetasPdf(rows: MetasPdfRow[]): Promise<Buffer> {
  const { doc, done } = startReportPdf({ title: "Metas" });

  if (rows.length === 0) {
    doc.fontSize(9).fillColor("#000000").text("Nenhuma meta cadastrada.");
  }

  for (const g of rows) {
    doc.fontSize(9).fillColor(g.isActive ? "#111111" : "#999999").text(
      `${g.name}${g.isActive ? "" : " (arquivada)"} — ${g.walletName}`,
    );
    doc
      .fontSize(8)
      .fillColor("#333333")
      .text(
        `${formatCurrencyBRL(g.balance)} de ${formatCurrencyBRL(g.targetAmount)} (${g.progress.toFixed(0)}%)` +
          (g.targetDate ? ` · até ${formatDateBR(g.targetDate)}` : ""),
      );
    doc.moveDown(0.4);
  }

  finishReportPdf(doc);
  return done;
}
