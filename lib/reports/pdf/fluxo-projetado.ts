import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL, MONTH_LABELS } from "@/lib/format";
import type { Decimal } from "@/lib/finance/types";

export interface FluxoProjetadoPdfPoint {
  monthIndex0: number;
  year: number;
  balance: Decimal;
}

export async function buildFluxoProjetadoPdf(
  current: Decimal,
  points: FluxoProjetadoPdfPoint[],
  regimeLabel: string,
  monthsAhead: number,
): Promise<Buffer> {
  const { doc, done } = startReportPdf({
    title: "Fluxo projetado",
    subtitle: `Próximos ${monthsAhead} meses · regime ${regimeLabel}`,
  });

  doc.fontSize(10).fillColor("#111111").text(`Saldo hoje: ${formatCurrencyBRL(current)}`);
  doc.moveDown(0.6);

  for (const p of points) {
    const color = p.balance.isNegative() ? "#dc2626" : "#059669";
    doc.fontSize(9).fillColor("#333333").text(`${MONTH_LABELS[p.monthIndex0]}/${p.year}`, { continued: true });
    doc.fillColor(color).text(`  ${formatCurrencyBRL(p.balance)}`);
  }

  finishReportPdf(doc);
  return done;
}
