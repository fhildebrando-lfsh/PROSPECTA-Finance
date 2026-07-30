import { describe, expect, it } from "vitest";
import { parseBrDate, parseBrlAmount } from "@/lib/import/parse-brl";

describe("parseBrDate", () => {
  it("parseia dd/mm/aaaa", () => {
    expect(parseBrDate("15/03/2026").toISOString().slice(0, 10)).toBe("2026-03-15");
  });

  it("aceita dia/mês sem zero à esquerda", () => {
    expect(parseBrDate("5/3/2026").toISOString().slice(0, 10)).toBe("2026-03-05");
  });

  it("rejeita data que não existe (31/02)", () => {
    expect(() => parseBrDate("31/02/2026")).toThrow();
  });

  it("rejeita formato errado", () => {
    expect(() => parseBrDate("2026-03-15")).toThrow();
    expect(() => parseBrDate("")).toThrow();
  });
});

describe("parseBrlAmount", () => {
  it("R$ com separador de milhar e vírgula decimal", () => {
    expect(parseBrlAmount("R$ 1.234,56").toNumber()).toBe(1234.56);
  });

  it("negativo com sinal", () => {
    expect(parseBrlAmount("-1.234,56").toNumber()).toBe(-1234.56);
  });

  it("negativo entre parênteses", () => {
    expect(parseBrlAmount("(1.234,56)").toNumber()).toBe(-1234.56);
  });

  it("sem separador de milhar", () => {
    expect(parseBrlAmount("35,00").toNumber()).toBe(35);
  });

  it("valor inteiro sem decimal", () => {
    expect(parseBrlAmount("1500").toNumber()).toBe(1500);
  });

  it("rejeita texto não numérico", () => {
    expect(() => parseBrlAmount("abc")).toThrow();
    expect(() => parseBrlAmount("")).toThrow();
  });
});
