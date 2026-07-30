import { describe, expect, it } from "vitest";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { Decimal } from "@/lib/finance/types";

describe("formatCurrencyBRL (§15 — locale pt-BR)", () => {
  it("usa vírgula decimal e ponto de milhar, nunca ponto decimal", () => {
    expect(formatCurrencyBRL(new Decimal(1234.5))).toBe("R$ 1.234,50");
  });

  it("valor negativo mantém o sinal", () => {
    expect(formatCurrencyBRL(new Decimal(-162))).toBe("-R$ 162,00");
  });

  it("zero formata normalmente (a cor âmbar é decidida por quem exibe, não aqui)", () => {
    expect(formatCurrencyBRL(new Decimal(0))).toBe("R$ 0,00");
  });

  it("aceita number puro também", () => {
    expect(formatCurrencyBRL(10)).toBe("R$ 10,00");
  });
});

describe("formatDateBR", () => {
  it("dd/mm/aaaa", () => {
    expect(formatDateBR(new Date(Date.UTC(2026, 0, 5)))).toBe("05/01/2026");
  });

  it("ignora o horário do Date", () => {
    expect(formatDateBR(new Date(Date.UTC(2026, 5, 30, 23, 59)))).toBe("30/06/2026");
  });
});
