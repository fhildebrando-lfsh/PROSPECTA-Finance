import { startReportPdf, finishReportPdf } from "../pdf-shared";
import { formatDateBR } from "@/lib/format";
import type { DeliverableContent } from "@/lib/method/deliverables/catalog";

/**
 * Etapa 9 (§12.1) — PDF de um artefato do método. Reaproveita o cabeçalho de
 * marca já usado pelos 8 relatórios existentes (`pdf-shared.ts`), em vez de
 * criar um segundo padrão de geração.
 *
 * A versão e a data aparecem no documento de propósito: um entregável é o
 * registro do que foi dito ao cliente **numa data**, e um PDF que circula por
 * e-mail sem esses dois dados vira uma afirmação sem contexto.
 */
export interface EntregavelPdfInput {
  codigo: string;
  nome: string;
  proposito: string;
  versao: number;
  status: string;
  criadoEm: Date;
  validadoEm: Date | null;
  content: DeliverableContent;
  /** Aviso exibido quando o nome completo da sigla ainda não foi confirmado. */
  nomeNaoConfirmado: boolean;
}

export async function buildEntregavelPdf(input: EntregavelPdfInput): Promise<Buffer> {
  const { doc, done } = startReportPdf({
    title: `${input.codigo} — ${input.nome}`,
    subtitle: `Versão ${input.versao} · ${input.status.toLowerCase()} · emitido em ${formatDateBR(input.criadoEm)}`,
  });

  doc.fontSize(9).fillColor("#555555").text(input.proposito);
  doc.moveDown(0.6);

  if (input.validadoEm) {
    doc.fontSize(8).fillColor("#166534").text(`Validado em ${formatDateBR(input.validadoEm)}.`);
    doc.moveDown(0.4);
  } else {
    doc
      .fontSize(8)
      .fillColor("#92400e")
      .text("Rascunho — este documento ainda não foi validado pelo consultor responsável.");
    doc.moveDown(0.4);
  }

  if (input.nomeNaoConfirmado) {
    doc
      .fontSize(7)
      .fillColor("#999999")
      .text(`O nome completo da sigla ${input.codigo} ainda não foi confirmado na documentação do método.`);
    doc.moveDown(0.4);
  }

  for (const section of input.content.sections) {
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#131A47").text(section.title);
    doc
      .fontSize(9)
      .fillColor(section.body.trim() ? "#111111" : "#999999")
      .text(section.body.trim() || "(seção ainda não preenchida)", { align: "justify" });
  }

  finishReportPdf(doc);
  return done;
}
