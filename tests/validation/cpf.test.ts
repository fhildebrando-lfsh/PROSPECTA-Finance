import { describe, expect, it } from "vitest";
import { isValidCPF, formatCPF } from "@/lib/validation/cpf";

describe("isValidCPF", () => {
  it("aceita CPF válido conhecido", () => {
    expect(isValidCPF("111.444.777-35")).toBe(true);
    expect(isValidCPF("11144477735")).toBe(true);
  });

  it("rejeita dígito verificador errado", () => {
    expect(isValidCPF("111.444.777-36")).toBe(false);
  });

  it("rejeita sequência repetida", () => {
    expect(isValidCPF("000.000.000-00")).toBe(false);
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });

  it("rejeita tamanho errado", () => {
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("")).toBe(false);
  });
});

describe("formatCPF", () => {
  it("formata progressivamente conforme os dígitos chegam", () => {
    expect(formatCPF("111")).toBe("111");
    expect(formatCPF("111444")).toBe("111.444");
    expect(formatCPF("111444777")).toBe("111.444.777");
    expect(formatCPF("11144477735")).toBe("111.444.777-35");
  });

  it("ignora caracteres não numéricos e corta em 11 dígitos", () => {
    expect(formatCPF("111.444.777-35extra")).toBe("111.444.777-35");
  });
});
