import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import type { OpenInstallmentGroup } from "@/lib/finance/open-installments";

export async function buildParceladasPdf(
  groups: OpenInstallmentGroup[],
  walletNameById: Map<string, string>,
  categoryNameById: Map<string, string>,
): Promise<Buffer> {
  const { doc, done } = startReportPdf({ title: "Despesas parceladas" });

  if (groups.length === 0) {
    doc.fontSize(9).fillColor("#000000").text("Nenhum parcelamento em aberto.");
  }

  for (const g of groups) {
    doc.fontSize(10).fillColor("#111111").text(g.description);
    doc
      .fontSize(8)
      .fillColor("#333333")
      .text(
        `${walletNameById.get(g.walletId) ?? "—"} · ${categoryNameById.get(g.categoryId) ?? "—"} · ${g.paidCount}/${g.installmentTotal} parcelas · restam ${g.remainingCount}`,
      );
    doc
      .fontSize(9)
      .fillColor("#dc2626")
      .text(
        `Restante: ${formatCurrencyBRL(g.remainingAmount)} · próxima ${g.nextDueDate ? formatDateBR(g.nextDueDate) : "—"} · prazo ${formatDateBR(g.lastDueDate)}`,
      );
    doc.moveDown(0.6);
  }

  finishReportPdf(doc);
  return done;
}
