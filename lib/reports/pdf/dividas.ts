import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import type { OpenInstallmentGroup } from "@/lib/finance/open-installments";
import type { Decimal } from "@/lib/finance/types";

export async function buildDividasPdf(
  totalDebt: Decimal,
  monthlyCommitment: Decimal,
  commitmentPct: Decimal | null,
  groups: OpenInstallmentGroup[],
  walletNameById: Map<string, string>,
  categoryNameById: Map<string, string>,
): Promise<Buffer> {
  const { doc, done } = startReportPdf({ title: "Dívidas" });

  doc
    .fontSize(9)
    .fillColor("#111111")
    .text(
      `Dívida total em aberto: ${formatCurrencyBRL(totalDebt.abs())}   ·   Compromisso mensal: ${formatCurrencyBRL(monthlyCommitment.abs())}` +
        (commitmentPct !== null ? `   ·   ${commitmentPct.toFixed(0)}% da despesa mensal média` : ""),
    );
  doc.moveDown(0.7);

  if (groups.length === 0) {
    doc.fontSize(9).fillColor("#000000").text("Nenhuma dívida em aberto.");
  }

  for (const g of groups) {
    doc.fontSize(10).fillColor("#111111").text(g.description);
    doc
      .fontSize(8)
      .fillColor("#333333")
      .text(
        `${walletNameById.get(g.walletId) ?? "—"} · ${categoryNameById.get(g.categoryId) ?? "—"} · total contratado ${formatCurrencyBRL(g.totalAmount.abs())} · ${g.paidCount}/${g.installmentTotal} parcelas`,
      );
    doc
      .fontSize(9)
      .fillColor("#dc2626")
      .text(
        `Restante: ${formatCurrencyBRL(g.remainingAmount.abs())} · próxima parcela ${g.nextDueDate ? formatDateBR(g.nextDueDate) : "—"} · até ${formatDateBR(g.lastDueDate)}`,
      );
    doc.moveDown(0.6);
  }

  finishReportPdf(doc);
  return done;
}
