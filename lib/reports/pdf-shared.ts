import PDFDocument from "pdfkit";

/** Mesma cor de marca usada no app (Sidebar, cards do Painel, `#131A47`). */
const BRAND_COLOR = "#131A47";

const COMPANY_BLURB =
  "A PROSPECTA Finance é uma plataforma de gestão financeira pessoal e familiar, criada para dar clareza e " +
  "controle sobre receitas, despesas, patrimônio e metas. Este relatório foi gerado automaticamente a partir " +
  "dos lançamentos registrados no sistema e reflete a situação financeira até a data de emissão.";

const DISCLAIMER =
  "Este documento tem finalidade informativa e não constitui recomendação de investimento nem aconselhamento " +
  "financeiro, contábil ou jurídico.";

export interface ReportPdfMeta {
  title: string;
  /** Período/filtros ativos — ex.: "Ano 2026, regime caixa". */
  subtitle?: string;
}

/**
 * Abre um PDF já com o cabeçalho de marca da PROSPECTA Finance — reaproveitado
 * pelos 8 relatórios (5 em Relatórios, 3 em Patrimônio). Mesmo mecanismo de
 * `lib/me/export-pdf.ts` (streaming em `chunks`, resolvido no evento `end`).
 * Chamador continua escrevendo no `doc` normalmente e termina chamando
 * `finishReportPdf(doc)`.
 */
export function startReportPdf(meta: ReportPdfMeta): { doc: PDFKit.PDFDocument; done: Promise<Buffer> } {
  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.rect(0, 0, doc.page.width, 64).fill(BRAND_COLOR);
  doc.fillColor("#ffffff").fontSize(15).text("PROSPECTA FINANCE", 40, 18);
  doc.fontSize(8).fillColor("#c7d2fe").text("Gestão financeira pessoal e familiar", 40, 38);

  doc.x = 40;
  doc.y = 84;
  doc.fillColor("#111111").fontSize(14).text(meta.title);
  if (meta.subtitle) doc.fontSize(9).fillColor("#555555").text(meta.subtitle);
  doc.fontSize(8).fillColor("#999999").text(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
  doc.moveDown(1.2);
  doc.fillColor("#000000");

  return { doc, done };
}

/** Rodapé com a descrição da empresa + aviso de não-aconselhamento — sempre o último passo. */
export function finishReportPdf(doc: PDFKit.PDFDocument): void {
  doc.moveDown(1.5);
  doc.fontSize(8).fillColor("#555555").text(COMPANY_BLURB);
  doc.moveDown(0.4);
  doc.fontSize(8).fillColor("#999999").text(DISCLAIMER);
  doc.end();
}
