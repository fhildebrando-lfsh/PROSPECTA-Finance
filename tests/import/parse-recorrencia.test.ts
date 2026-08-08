import { describe, expect, it } from "vitest";
import { parseRecorrencia } from "@/lib/import/parse-recorrencia";

describe("parseRecorrencia (§8.5)", () => {
  it("número solto vira UNICA + installment_number, sem installment_total (não é possível derivar)", () => {
    expect(parseRecorrencia("105")).toEqual({
      recurrenceKind: "UNICA",
      installmentNumber: 105,
      installmentTotal: null,
      isPatrimonio: false,
      isProjecao: false,
      legacyLabel: "105",
    });
  });

  it('formato "N de M" (o real da planilha, não só o número solto documentado) extrai as duas partes', () => {
    expect(parseRecorrencia("64 de 96")).toEqual({
      recurrenceKind: "UNICA",
      installmentNumber: 64,
      installmentTotal: 96,
      isPatrimonio: false,
      isProjecao: false,
      legacyLabel: "64 de 96",
    });
    expect(parseRecorrencia("117 de 360").installmentTotal).toBe(360);
  });

  it('formato "N/M" (a outra variante usada na planilha) também é aceito', () => {
    expect(parseRecorrencia("1/2")).toEqual({
      recurrenceKind: "UNICA",
      installmentNumber: 1,
      installmentTotal: 2,
      isPatrimonio: false,
      isProjecao: false,
      legacyLabel: "1/2",
    });
  });

  it("Mensal, Anual, Variável mapeiam para os códigos certos", () => {
    expect(parseRecorrencia("Mensal").recurrenceKind).toBe("MENSAL");
    expect(parseRecorrencia("Anual").recurrenceKind).toBe("ANUAL");
    expect(parseRecorrencia("Variável").recurrenceKind).toBe("VARIAVEL");
  });

  it("Patrimônio vira UNICA + isPatrimonio, não polui a enumeração (§6.4)", () => {
    const result = parseRecorrencia("Patrimônio");
    expect(result.recurrenceKind).toBe("UNICA");
    expect(result.isPatrimonio).toBe(true);
    expect(result.installmentNumber).toBeNull();
  });

  it("previsão vira UNICA + isProjecao", () => {
    const result = parseRecorrencia("previsão");
    expect(result.recurrenceKind).toBe("UNICA");
    expect(result.isProjecao).toBe(true);
  });

  it("é insensível a maiúsculas/acentos", () => {
    expect(parseRecorrencia("MENSAL").recurrenceKind).toBe("MENSAL");
    expect(parseRecorrencia("mensal").recurrenceKind).toBe("MENSAL");
  });

  it("rejeita valor desconhecido", () => {
    expect(() => parseRecorrencia("Quinzenal")).toThrow();
    expect(() => parseRecorrencia("")).toThrow();
  });
});
