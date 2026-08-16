import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  construcaoPatrimonial,
  endividamento,
  faixaForPercent,
  liquidez,
  organizacao,
  protecao,
} from "@/lib/method/psf";

describe("faixaForPercent (§8.3 — 5 faixas)", () => {
  it("classifica os limites exatos das 5 faixas", () => {
    expect(faixaForPercent(0)).toBe("critico");
    expect(faixaForPercent(20)).toBe("critico");
    expect(faixaForPercent(20.1)).toBe("fragil");
    expect(faixaForPercent(40)).toBe("fragil");
    expect(faixaForPercent(40.1)).toBe("em_construcao");
    expect(faixaForPercent(60)).toBe("em_construcao");
    expect(faixaForPercent(60.1)).toBe("saudavel");
    expect(faixaForPercent(80)).toBe("saudavel");
    expect(faixaForPercent(80.1)).toBe("consolidado");
    expect(faixaForPercent(100)).toBe("consolidado");
  });

  it("nunca sai do intervalo 0-100 mesmo com entrada fora da faixa", () => {
    expect(faixaForPercent(-10)).toBe("critico");
    expect(faixaForPercent(150)).toBe("consolidado");
  });
});

describe("organizacao", () => {
  it("usa o Índice de Consistência direto, sem transformação", () => {
    expect(organizacao(75)).toEqual({ faixa: "saudavel", valor: 75 });
  });

  it("não avaliado quando o Índice de Consistência é null", () => {
    expect(organizacao(null)).toEqual({ faixa: null, valor: null });
  });
});

describe("endividamento", () => {
  it("100 (crítico invertido = ótimo) quando não há compromisso de dívida", () => {
    const result = endividamento(new Decimal(0), new Decimal(5000));
    expect(result.valor).toBe(100);
    expect(result.faixa).toBe("consolidado");
  });

  it("50% de comprometimento da renda zera a nota", () => {
    const result = endividamento(new Decimal(2500), new Decimal(5000));
    expect(result.valor).toBe(0);
  });

  it("25% de comprometimento vale 50 (meio do caminho)", () => {
    const result = endividamento(new Decimal(1250), new Decimal(5000));
    expect(result.valor).toBe(50);
  });

  it("comprometimento acima de 50% nunca fica negativo — trava em 0", () => {
    const result = endividamento(new Decimal(4000), new Decimal(5000));
    expect(result.valor).toBe(0);
  });

  it("não avaliado quando não há renda média (evita divisão por zero)", () => {
    expect(endividamento(new Decimal(1000), new Decimal(0))).toEqual({ faixa: null, valor: null });
  });
});

describe("liquidez", () => {
  it("6 meses de despesa em saldo = 100 (alvo atingido)", () => {
    const result = liquidez(new Decimal(12000), new Decimal(2000));
    expect(result.valor).toBe(100);
  });

  it("3 meses de despesa em saldo = 50 (metade do alvo)", () => {
    const result = liquidez(new Decimal(6000), new Decimal(2000));
    expect(result.valor).toBe(50);
  });

  it("mais que 6 meses trava em 100, nunca passa", () => {
    const result = liquidez(new Decimal(50000), new Decimal(2000));
    expect(result.valor).toBe(100);
  });

  it("não avaliado sem despesa média (evita divisão por zero)", () => {
    expect(liquidez(new Decimal(5000), new Decimal(0))).toEqual({ faixa: null, valor: null });
  });
});

describe("protecao (só reserva, por enquanto — cadastro de apólices é Etapa 12)", () => {
  it("reaproveita o percentual de reserva diretamente", () => {
    expect(protecao(70)).toEqual({ faixa: "saudavel", valor: 70 });
  });
});

describe("construcaoPatrimonial", () => {
  it("atingir o piso da banda de renda já vale 100%", () => {
    const result = construcaoPatrimonial(15, 15);
    expect(result.valor).toBe(100);
  });

  it("metade do piso da banda vale 50%", () => {
    const result = construcaoPatrimonial(7.5, 15);
    expect(result.valor).toBe(50);
  });

  it("passar do piso trava em 100, nunca passa", () => {
    const result = construcaoPatrimonial(30, 15);
    expect(result.valor).toBe(100);
  });

  it("não avaliado quando o piso da banda é zero ou negativo", () => {
    expect(construcaoPatrimonial(10, 0)).toEqual({ faixa: null, valor: null });
  });
});
