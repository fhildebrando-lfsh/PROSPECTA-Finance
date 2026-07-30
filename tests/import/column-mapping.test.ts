import { describe, expect, it } from "vitest";
import { autoDetectMapping, missingRequiredFields } from "@/lib/import/column-mapping";

describe("autoDetectMapping (§18.1 passo 2)", () => {
  it("reconhece os cabeçalhos da planilha atual", () => {
    const headers = [
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
      "Observação",
    ];

    const mapping = autoDetectMapping(headers);
    expect(mapping.transactionDate).toBe("Compra");
    expect(mapping.dueDate).toBe("Vence");
    expect(mapping.walletName).toBe("Tipo de Carteira");
    expect(mapping.nature).toBe("Tipo");
    expect(mapping.categoryName).toBe("Categoria");
    expect(mapping.subcategoryName).toBe("Subcategoria");
    expect(mapping.description).toBe("Descrição");
    expect(mapping.responsibleName).toBe("Responsáveis");
    expect(mapping.amount).toBe("Valor");
    expect(mapping.recorrencia).toBe("Recorrência");
    expect(mapping.statusLabel).toBe("Situação");
    expect(mapping.note).toBe("Observação");
  });

  it("ignora cabeçalhos desconhecidos sem quebrar", () => {
    const mapping = autoDetectMapping(["Compra", "Coluna Estranha"]);
    expect(mapping.transactionDate).toBe("Compra");
    expect(Object.keys(mapping)).toHaveLength(1);
  });
});

describe("missingRequiredFields", () => {
  it("aponta os campos obrigatórios que faltam mapear", () => {
    const missing = missingRequiredFields({ transactionDate: "Compra" });
    expect(missing).toContain("dueDate");
    expect(missing).toContain("amount");
    expect(missing).not.toContain("transactionDate");
  });

  it("subcategoryName e note não são obrigatórios", () => {
    const missing = missingRequiredFields({
      transactionDate: "Compra",
      dueDate: "Vence",
      walletName: "Tipo de Carteira",
      nature: "Tipo",
      categoryName: "Categoria",
      description: "Descrição",
      responsibleName: "Responsáveis",
      amount: "Valor",
      recorrencia: "Recorrência",
      statusLabel: "Situação",
    });
    expect(missing).toEqual([]);
  });
});
