import PDFDocument from "pdfkit";
import { formatCPF } from "@/lib/validation/cpf";
import { formatDateBR } from "@/lib/format";
import type { ExportRow } from "@/lib/entries/export-row";

interface MyDataPdfInput {
  dadosDaConta: {
    email: string | null | undefined;
    nomeCompleto: string | null;
    telefone: string | null;
    cpf: string | null;
    dataDeNascimento: Date | null;
    addressCep: string | null;
    addressStreet: string | null;
    addressNumber: string | null;
    addressComplement: string | null;
    addressNeighborhood: string | null;
    addressCity: string | null;
    addressState: string | null;
    cadastradoEm: Date;
    politicaDePrivacidadeAceitaEm: Date | null;
  };
  workspaces: { workspace: string; papel: string; desde: Date }[];
  lancamentos: ExportRow[];
}

function field(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fontSize(10).fillColor("#333").text(`${label}: `, { continued: true }).fillColor("#000").text(value || "—");
}

/**
 * LGPD Art. 18, V — portabilidade, em formato legível por humanos (o JSON já
 * cobre "legível por máquina"). Lista simples em vez de tabela desenhada —
 * pdfkit não tem grid nativo e uma tabela manual não paga o esforço aqui.
 */
export async function buildMyDataPdf({ dadosDaConta, workspaces, lancamentos }: MyDataPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  doc.fontSize(16).fillColor("#000").text("Meus dados — PROSPECTA Finance");
  doc.fontSize(9).fillColor("#666").text(`Exportado em ${new Date().toLocaleString("pt-BR")}`);
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor("#000").text("Dados pessoais");
  doc.moveDown(0.3);
  field(doc, "Nome completo", dadosDaConta.nomeCompleto ?? "—");
  field(doc, "E-mail", dadosDaConta.email ?? "—");
  field(doc, "Telefone", dadosDaConta.telefone ?? "—");
  field(doc, "CPF", dadosDaConta.cpf ? formatCPF(dadosDaConta.cpf) : "—");
  field(doc, "Data de nascimento", dadosDaConta.dataDeNascimento ? formatDateBR(dadosDaConta.dataDeNascimento) : "—");
  const endereco = [
    dadosDaConta.addressStreet,
    dadosDaConta.addressNumber,
    dadosDaConta.addressComplement,
    dadosDaConta.addressNeighborhood,
    dadosDaConta.addressCity,
    dadosDaConta.addressState,
    dadosDaConta.addressCep,
  ]
    .filter(Boolean)
    .join(", ");
  field(doc, "Endereço", endereco || "—");
  field(doc, "Cadastrado em", formatDateBR(dadosDaConta.cadastradoEm));
  field(
    doc,
    "Política de Privacidade aceita em",
    dadosDaConta.politicaDePrivacidadeAceitaEm ? formatDateBR(dadosDaConta.politicaDePrivacidadeAceitaEm) : "—",
  );

  doc.moveDown(1);
  doc.fontSize(13).fillColor("#000").text("Workspaces");
  doc.moveDown(0.3);
  if (workspaces.length === 0) {
    doc.fontSize(10).fillColor("#000").text("—");
  }
  for (const w of workspaces) {
    doc.fontSize(10).fillColor("#000").text(`${w.workspace} · ${w.papel} · desde ${formatDateBR(w.desde)}`);
  }

  doc.moveDown(1);
  doc.fontSize(13).fillColor("#000").text(`Lançamentos financeiros (${lancamentos.length})`);
  doc.moveDown(0.3);
  if (lancamentos.length === 0) {
    doc.fontSize(10).fillColor("#000").text("Nenhum lançamento.");
  }
  for (const row of lancamentos) {
    doc
      .fontSize(8.5)
      .fillColor("#000")
      .text(
        `${row.Vence} · ${row.Descrição} · ${row.Categoria}${row.Subcategoria ? ` / ${row.Subcategoria}` : ""} · ${row.Valor} · ${row.Situação} · ${row["Tipo de Carteira"]}`,
      );
  }

  doc.end();
  return done;
}
