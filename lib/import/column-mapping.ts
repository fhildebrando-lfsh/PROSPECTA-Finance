import { slugify } from "@/lib/slug";

/** Campos do lançamento que o importador reconhece (§18.1). */
export type ImportField =
  | "transactionDate"
  | "dueDate"
  | "walletName"
  | "nature"
  | "categoryName"
  | "subcategoryName"
  | "description"
  | "responsibleName"
  | "amount"
  | "recorrencia"
  | "statusLabel"
  | "note"
  | "tags";

export const REQUIRED_FIELDS: ImportField[] = [
  "transactionDate",
  "dueDate",
  "walletName",
  "nature",
  "categoryName",
  "description",
  "responsibleName",
  "amount",
  "recorrencia",
  "statusLabel",
];

/** Cabeçalhos da planilha atual (§18.1), normalizados via slugify. */
const KNOWN_HEADERS: Record<string, ImportField> = {
  compra: "transactionDate",
  vence: "dueDate",
  tipo_de_carteira: "walletName",
  tipo: "nature",
  categoria: "categoryName",
  subcategoria: "subcategoryName",
  descricao: "description",
  responsaveis: "responsibleName",
  responsavel: "responsibleName",
  valor: "amount",
  recorrencia: "recorrencia",
  situacao: "statusLabel",
  observacao: "note",
  /// §8.1 — "Organização" (CONTA / vazio) vira array de tags livres, não um campo fixo.
  organizacao: "tags",
};

/** Usado por parse-csv.ts para achar a linha de cabeçalho de verdade num arquivo com linhas de lixo antes dela. */
export const KNOWN_HEADER_SLUGS = new Set(Object.keys(KNOWN_HEADERS));

export type ColumnMapping = Partial<Record<ImportField, string>>;

/** Propõe o mapeamento a partir dos nomes de cabeçalho do arquivo enviado. */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of headers) {
    const field = KNOWN_HEADERS[slugify(header)];
    if (field && !mapping[field]) {
      mapping[field] = header;
    }
  }
  return mapping;
}

export function missingRequiredFields(mapping: ColumnMapping): ImportField[] {
  return REQUIRED_FIELDS.filter((field) => !mapping[field]);
}
