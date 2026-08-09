/**
 * Só roda no navegador (importado por `ImportWizard.tsx`, um Client
 * Component) — nunca do lado do servidor. O arquivo e a eventual senha
 * nunca saem do computador do usuário; só o texto já extraído (ou, depois
 * de um leitor de banco existir, as transações já interpretadas) vira uma
 * requisição pro servidor, exatamente como CSV/OFX já fazem hoje.
 */
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

export interface ExtractedPdf {
  pages: string[];
}

export class PdfPasswordError extends Error {
  constructor() {
    super("Senha do PDF incorreta ou não informada.");
    this.name = "PdfPasswordError";
  }
}

/** Extrai o texto de cada página de um PDF, opcionalmente protegido por senha. */
export async function extractPdfText(file: File, password?: string): Promise<ExtractedPdf> {
  const data = await file.arrayBuffer();

  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data, password }).promise;
  } catch (err) {
    if (err instanceof Error && err.name === "PasswordException") {
      throw new PdfPasswordError();
    }
    throw err;
  }

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pages.push(text);
  }

  return { pages };
}
