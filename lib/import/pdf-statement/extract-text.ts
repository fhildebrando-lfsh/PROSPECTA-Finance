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

interface TextRun {
  str: string;
  x: number;
  y: number;
}

const SAME_LINE_Y_TOLERANCE = 2;

/**
 * Agrupa os fragmentos de texto de uma página em linhas, pela posição Y de
 * cada um (`transform[5]` do item do pdf.js) — sem isso, `getTextContent()`
 * devolve um item por palavra/trecho sem nenhuma quebra de linha, e uma
 * fatura inteira vira um único parágrafo corrido, impossível de casar com
 * regex por linha (data + descrição + valor). Assumindo que cada fatura é
 * gerada como uma tabela normal (item da esquerda pra direita, linha de cima
 * pra baixo — verdade pra Nubank, Itaú, Santander, Casas Bahia/Bradesco e
 * Porto Seguro conferidos em 2026-08-09), reconstrói cada linha visual.
 *
 * O agrupamento em si (por proximidade de Y) usa a ordenação (Y desc, X asc)
 * só pra formar os grupos — mas dentro de um mesmo grupo, dois fragmentos
 * "da mesma linha" quase nunca têm o Y EXATAMENTE igual (variação de
 * sub-pixel entre fontes/baselines diferentes na mesma linha visual, comum
 * em fatura antiga do Santander). Como o desempate por X só valia quando o Y
 * batia exatamente, esses fragmentos podiam sair fora de ordem de leitura
 * (ex.: "PARC 08/12" antes de "MERCPAGO", quando o X real dizia o
 * contrário) — por isso cada linha é reordenada por X puro depois de
 * formada, garantindo a ordem de leitura esquerda-pra-direita.
 */
function groupIntoLines(items: TextRun[]): string[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: TextRun[][] = [];

  for (const item of sorted) {
    const currentLine = lines.at(-1);
    if (currentLine && Math.abs(currentLine[0].y - item.y) <= SAME_LINE_Y_TOLERANCE) {
      currentLine.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines
    .map((line) =>
      [...line]
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

/** Extrai o texto de cada página de um PDF, opcionalmente protegido por senha — uma
 * string por página, com quebra de linha (`\n`) reconstruída entre cada linha visual
 * da tabela original (ver `groupIntoLines`). */
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
    const items: TextRun[] = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item && "transform" in item)
      .map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5] }));
    pages.push(groupIntoLines(items).join("\n"));
  }

  return { pages };
}
