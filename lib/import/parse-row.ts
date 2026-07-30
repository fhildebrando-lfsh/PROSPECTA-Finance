import { Decimal, type EntryNature } from "@/lib/finance/types";
import { parseBrDate, parseBrlAmount } from "./parse-brl";
import { parseRecorrencia, type ParsedRecurrence } from "./parse-recorrencia";
import { parseStatusLabel } from "./parse-status";
import type { ColumnMapping, ImportField } from "./column-mapping";

export type IssueSeverity = "erro" | "aviso";

export interface RowIssue {
  field: string;
  severity: IssueSeverity;
  message: string;
}

export interface ParsedRowData {
  transactionDate: Date | null;
  dueDate: Date | null;
  walletName: string | null;
  nature: EntryNature | null;
  categoryName: string | null;
  subcategoryName: string | null;
  description: string | null;
  responsibleName: string | null;
  amount: Decimal | null;
  recurrence: ParsedRecurrence | null;
  statusCode: string | null;
  note: string | null;
  tags: string[];
}

export interface ParsedRow {
  raw: Record<string, string>;
  issues: RowIssue[];
  data: ParsedRowData;
}

const VALID_NATURES = new Set<EntryNature>(["RECEITA", "DESPESA", "INVESTIMENTO", "OUTRO"]);

/**
 * §18.1 passo 3 — validação linha a linha, só do que dá para checar sem o
 * banco (formato de data/valor, natureza fora das 4, sinal incoerente com
 * a natureza — soft, §8.3). Existência de carteira/categoria/subcategoria
 * e duplicidade dependem do banco e ficam em resolve-row.ts.
 */
export function parseImportRow(raw: Record<string, string>, mapping: ColumnMapping): ParsedRow {
  const issues: RowIssue[] = [];

  const get = (field: ImportField): string => {
    const header = mapping[field];
    return header ? (raw[header] ?? "").trim() : "";
  };

  const requireText = (field: ImportField, label: string): string | null => {
    const value = get(field);
    if (!value) {
      issues.push({ field, severity: "erro", message: `${label} vazio` });
      return null;
    }
    return value;
  };

  let transactionDate: Date | null = null;
  try {
    transactionDate = parseBrDate(get("transactionDate"));
  } catch (err) {
    issues.push({ field: "transactionDate", severity: "erro", message: (err as Error).message });
  }

  let dueDate: Date | null = null;
  try {
    dueDate = parseBrDate(get("dueDate"));
  } catch (err) {
    issues.push({ field: "dueDate", severity: "erro", message: (err as Error).message });
  }

  const walletName = requireText("walletName", "carteira");
  const categoryName = requireText("categoryName", "categoria");
  const description = requireText("description", "descrição");
  const responsibleName = requireText("responsibleName", "responsável");
  const subcategoryName = get("subcategoryName") || null;
  const note = get("note") || null;
  // §8.1 — "Organização" (CONTA / vazio na planilha) vira tags livres;
  // ";" ou "," separam múltiplas tags caso um dia existam.
  const tags = get("tags")
    .split(/[;,]/)
    .map((t) => t.trim())
    .filter(Boolean);

  let nature: EntryNature | null = null;
  const natureRaw = get("nature").toUpperCase();
  if (!VALID_NATURES.has(natureRaw as EntryNature)) {
    issues.push({ field: "nature", severity: "erro", message: `tipo fora das 4 naturezas: "${get("nature")}"` });
  } else {
    nature = natureRaw as EntryNature;
  }

  let amount: Decimal | null = null;
  try {
    amount = parseBrlAmount(get("amount"));
  } catch (err) {
    issues.push({ field: "amount", severity: "erro", message: (err as Error).message });
  }

  let recurrence: ParsedRecurrence | null = null;
  try {
    recurrence = parseRecorrencia(get("recorrencia"));
  } catch (err) {
    issues.push({ field: "recorrencia", severity: "erro", message: (err as Error).message });
  }

  let statusCode: string | null = null;
  try {
    statusCode = parseStatusLabel(get("statusLabel"));
  } catch (err) {
    issues.push({ field: "statusLabel", severity: "erro", message: (err as Error).message });
  }

  // §8.3 — sinal x natureza é soft (avisa, não bloqueia — Ajuste/Estorno fogem da regra)
  if (nature && amount) {
    if (nature === "RECEITA" && amount.lt(0)) {
      issues.push({ field: "amount", severity: "aviso", message: "receita com valor negativo" });
    }
    if (nature === "DESPESA" && amount.gt(0)) {
      issues.push({ field: "amount", severity: "aviso", message: "despesa com valor positivo" });
    }
  }
  if (statusCode === "ISENTO" && amount && !amount.isZero()) {
    issues.push({ field: "amount", severity: "aviso", message: "situação Isento normalmente tem valor 0,00" });
  }

  return {
    raw,
    issues,
    data: {
      transactionDate,
      dueDate,
      walletName,
      nature,
      categoryName,
      subcategoryName,
      description,
      responsibleName,
      amount,
      recurrence,
      statusCode,
      note,
      tags,
    },
  };
}

export function hasErrors(row: ParsedRow): boolean {
  return row.issues.some((issue) => issue.severity === "erro");
}
