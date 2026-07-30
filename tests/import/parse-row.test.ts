import { describe, expect, it } from "vitest";
import { hasErrors, parseImportRow } from "@/lib/import/parse-row";
import type { ColumnMapping } from "@/lib/import/column-mapping";

const mapping: ColumnMapping = {
  transactionDate: "Compra",
  dueDate: "Vence",
  walletName: "Tipo de Carteira",
  nature: "Tipo",
  categoryName: "Categoria",
  subcategoryName: "Subcategoria",
  description: "Descrição",
  responsibleName: "Responsáveis",
  amount: "Valor",
  recorrencia: "Recorrência",
  statusLabel: "Situação",
  note: "Observação",
};

function row(overrides: Record<string, string> = {}) {
  return {
    Compra: "03/01/2026",
    Vence: "09/02/2026",
    "Tipo de Carteira": "Itaú",
    Tipo: "DESPESA",
    Categoria: "1.Alimentação",
    Subcategoria: "Padaria",
    Descrição: "PÃO",
    Responsáveis: "Felipe (eu)",
    Valor: "-35,00",
    Recorrência: "1",
    Situação: "pago",
    Observação: "",
    ...overrides,
  };
}

describe("parseImportRow (§18.1 passo 3)", () => {
  it("linha válida não gera erro", () => {
    const result = parseImportRow(row(), mapping);
    expect(hasErrors(result)).toBe(false);
    expect(result.data.amount?.toNumber()).toBe(-35);
    expect(result.data.nature).toBe("DESPESA");
    expect(result.data.statusCode).toBe("PAGO");
    expect(result.data.recurrence?.installmentNumber).toBe(1);
  });

  it("data inválida vira erro no campo certo", () => {
    const result = parseImportRow(row({ Compra: "31/02/2026" }), mapping);
    expect(hasErrors(result)).toBe(true);
    expect(result.issues.some((i) => i.field === "transactionDate" && i.severity === "erro")).toBe(true);
  });

  it("tipo fora das 4 naturezas é erro", () => {
    const result = parseImportRow(row({ Tipo: "TRANSFERENCIA" }), mapping);
    expect(result.issues.some((i) => i.field === "nature" && i.severity === "erro")).toBe(true);
  });

  it("valor não numérico é erro", () => {
    const result = parseImportRow(row({ Valor: "abc" }), mapping);
    expect(result.issues.some((i) => i.field === "amount" && i.severity === "erro")).toBe(true);
  });

  it("campo obrigatório vazio é erro", () => {
    const result = parseImportRow(row({ "Tipo de Carteira": "" }), mapping);
    expect(result.issues.some((i) => i.field === "walletName" && i.severity === "erro")).toBe(true);
  });

  it("subcategoria e observação vazias não são erro (opcionais)", () => {
    const result = parseImportRow(row({ Subcategoria: "", Observação: "" }), mapping);
    expect(hasErrors(result)).toBe(false);
    expect(result.data.subcategoryName).toBeNull();
  });

  it("sinal incoerente com natureza é aviso, não erro (§8.3, soft)", () => {
    const result = parseImportRow(row({ Tipo: "DESPESA", Valor: "35,00" }), mapping);
    expect(hasErrors(result)).toBe(false);
    expect(result.issues.some((i) => i.field === "amount" && i.severity === "aviso")).toBe(true);
  });

  it("Isento com valor diferente de zero gera aviso", () => {
    const result = parseImportRow(row({ Situação: "Isento", Valor: "0,00" }), mapping);
    expect(result.issues.filter((i) => i.severity === "aviso")).toHaveLength(0);

    const withValue = parseImportRow(row({ Situação: "Isento", Valor: "50,00" }), mapping);
    expect(withValue.issues.some((i) => i.severity === "aviso" && i.message.includes("Isento"))).toBe(true);
  });
});
