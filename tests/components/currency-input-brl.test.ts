import { describe, expect, it } from "vitest";
import { centsToDisplay, centsToRaw, parseDefaultValueToCents } from "@/components/ui/CurrencyInputBRL";

describe("CurrencyInputBRL — formatação de exibição (pt-BR)", () => {
  // Intl.NumberFormat usa espaço não separável (U+00A0) entre "R$" e o valor.
  it("formata centavos como moeda brasileira, com separador de milhar", () => {
    expect(centsToDisplay(150000)).toBe("R$ 1.500,00");
    expect(centsToDisplay(1)).toBe("R$ 0,01");
    expect(centsToDisplay(0)).toBe("R$ 0,00");
  });

  it("vazio (null) não mostra 'R$ 0,00' — campo fica em branco (opcional)", () => {
    expect(centsToDisplay(null)).toBe("");
  });
});

describe("CurrencyInputBRL — valor cru mandado pro formulário (decimal com ponto)", () => {
  it("converte centavos para string decimal com ponto, não vírgula", () => {
    expect(centsToRaw(150000)).toBe("1500.00");
    expect(centsToRaw(1)).toBe("0.01");
  });

  it("vazio (null) manda string vazia, não '0.00' — Server Action trata como campo não preenchido", () => {
    expect(centsToRaw(null)).toBe("");
  });
});

describe("CurrencyInputBRL — valor inicial (defaultValue vindo do banco)", () => {
  it("converte string decimal do banco ('1500.00') para centavos", () => {
    expect(parseDefaultValueToCents("1500.00")).toBe(150000);
    expect(parseDefaultValueToCents("0.01")).toBe(1);
  });

  it("aceita number também", () => {
    expect(parseDefaultValueToCents(1500)).toBe(150000);
  });

  it("null/undefined/vazio viram null (campo em branco)", () => {
    expect(parseDefaultValueToCents(null)).toBeNull();
    expect(parseDefaultValueToCents(undefined)).toBeNull();
    expect(parseDefaultValueToCents("")).toBeNull();
  });

  it("valor não numérico vira null (não quebra)", () => {
    expect(parseDefaultValueToCents("abc")).toBeNull();
  });
});

describe("CurrencyInputBRL — ida e volta (defaultValue -> centavos -> valor cru) preserva o valor", () => {
  it("round-trip não perde nem adiciona centavos", () => {
    const original = "2430.50";
    const cents = parseDefaultValueToCents(original);
    expect(centsToRaw(cents)).toBe(original);
  });
});
