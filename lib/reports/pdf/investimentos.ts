import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL } from "@/lib/format";
import type { Decimal } from "@/lib/finance/types";
import type { PortfolioAllocationSlice } from "@/lib/finance/investment";

export interface InvestimentosPdfRow {
  name: string;
  classLabel: string;
  acquisitionValue: Decimal;
  currentValue: Decimal;
  returnPct: Decimal;
}

export async function buildInvestimentosPdf(
  totalInvested: Decimal,
  totalCurrent: Decimal,
  consolidatedReturnPct: Decimal,
  totalIncome: Decimal,
  allocation: PortfolioAllocationSlice[],
  rows: InvestimentosPdfRow[],
): Promise<Buffer> {
  const { doc, done } = startReportPdf({ title: "Investimentos" });

  doc
    .fontSize(9)
    .fillColor("#111111")
    .text(
      `Total investido: ${formatCurrencyBRL(totalInvested)}   ·   Valor atual: ${formatCurrencyBRL(totalCurrent)}   ·   ` +
        `Rentabilidade consolidada: ${consolidatedReturnPct.toFixed(1)}%   ·   Renda recebida: ${formatCurrencyBRL(totalIncome)}`,
    );
  doc.moveDown(0.9);

  doc.fontSize(11).fillColor("#111111").text("Alocação por classe");
  doc.moveDown(0.3);
  if (allocation.length === 0) {
    doc.fontSize(9).fillColor("#000000").text("Nenhum investimento ativo ainda.");
  }
  for (const a of allocation) {
    doc
      .fontSize(9)
      .fillColor("#333333")
      .text(`${a.classLabel}: ${a.percentage.toFixed(0)}% (${formatCurrencyBRL(a.value)})`);
  }
  doc.moveDown(0.9);

  doc.fontSize(11).fillColor("#111111").text("Posições");
  doc.moveDown(0.3);
  if (rows.length === 0) {
    doc.fontSize(9).fillColor("#000000").text("Nenhum investimento ativo ainda.");
  }
  for (const r of rows) {
    doc.fontSize(10).fillColor("#111111").text(r.name);
    doc
      .fontSize(8)
      .fillColor("#333333")
      .text(`${r.classLabel} · investido ${formatCurrencyBRL(r.acquisitionValue)} · valor atual ${formatCurrencyBRL(r.currentValue)}`);
    doc
      .fontSize(9)
      .fillColor(r.returnPct.isNegative() ? "#dc2626" : "#059669")
      .text(`Rentabilidade: ${r.returnPct.toFixed(1)}%`);
    doc.moveDown(0.6);
  }

  finishReportPdf(doc);
  return done;
}
