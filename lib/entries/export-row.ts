import { Decimal } from "@/lib/finance/types";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { recurrenceLabel } from "./recurrence-label";

/** Mesmos cabeçalhos que o importador reconhece (§18.1/§18.2 — ida e volta sem perda). */
export const EXPORT_HEADERS = [
  "Compra",
  "Vence",
  "Tipo de Carteira",
  "Tipo",
  "Categoria",
  "Subcategoria",
  "Descrição",
  "Responsáveis",
  "Valor",
  "Recorrência",
  "Situação",
  "Organização",
  "Observação",
] as const;

export interface ExportableEntry {
  transactionDate: Date;
  dueDate: Date;
  wallet: { name: string };
  nature: string;
  category: { name: string };
  subcategory: { name: string } | null;
  description: string;
  responsible: { name: string };
  amount: Decimal;
  legacyRecurrenceLabel: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  recurrence: { legacyLabel: string | null; code: string };
  status: { labelPt: string };
  tags: string[];
  note: string | null;
}

export interface ExportRow {
  Compra: string;
  Vence: string;
  "Tipo de Carteira": string;
  Tipo: string;
  Categoria: string;
  Subcategoria: string;
  Descrição: string;
  Responsáveis: string;
  Valor: string;
  Recorrência: string;
  Situação: string;
  Organização: string;
  Observação: string;
}

export function toExportRow(entry: ExportableEntry, natureLabelByCode: Map<string, string>): ExportRow {
  return {
    Compra: formatDateBR(entry.transactionDate),
    Vence: formatDateBR(entry.dueDate),
    "Tipo de Carteira": entry.wallet.name,
    Tipo: natureLabelByCode.get(entry.nature) ?? entry.nature,
    Categoria: entry.category.name,
    Subcategoria: entry.subcategory?.name ?? "",
    Descrição: entry.description,
    Responsáveis: entry.responsible.name,
    Valor: formatCurrencyBRL(entry.amount),
    Recorrência: recurrenceLabel(entry),
    Situação: entry.status.labelPt,
    Organização: entry.tags.join(";"),
    Observação: entry.note ?? "",
  };
}
