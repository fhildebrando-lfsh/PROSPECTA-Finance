import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  construcaoPatrimonial,
  longevidade,
  endividamento,
  faixaForPercent,
  liquidez,
  organizacao,
  protecao,
  liquidezPorReservaRecomendada,
  protecaoCompleta,
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

/**
 * Etapa 9-A.7 — o PSF passa a consumir o MCRF. A diferença é conceitual: o
 * alvo deixa de ser "6 meses para todo mundo" e passa a ser a reserva calculada
 * para os riscos daquela pessoa.
 */
describe("liquidezPorReservaRecomendada", () => {
  it("mede progresso contra a reserva recomendada, não contra um alvo fixo", () => {
    const r = liquidezPorReservaRecomendada(new Decimal(15000), new Decimal(30000));
    expect(r.valor).toBe(50);
    expect(r.faixa).toBe("em_construcao");
  });

  it("reserva atingida chega ao topo da escala", () => {
    expect(liquidezPorReservaRecomendada(new Decimal(30000), new Decimal(30000)).valor).toBe(100);
  });

  it("acima da meta não passa de 100", () => {
    expect(liquidezPorReservaRecomendada(new Decimal(90000), new Decimal(30000)).valor).toBe(100);
  });

  it("sem recomendação calculada devolve não avaliado, nunca zero", () => {
    // Zero significaria "sem nenhuma liquidez", o oposto de "ainda não calculado".
    expect(liquidezPorReservaRecomendada(new Decimal(50000), new Decimal(0)).faixa).toBeNull();
  });

  /**
   * A razão de existir da mudança: dois clientes com a mesma reserva guardada
   * recebem leituras diferentes porque correm riscos diferentes.
   */
  it("mesma reserva guardada e riscos diferentes dão faixas diferentes", () => {
    const estavel = liquidezPorReservaRecomendada(new Decimal(20000), new Decimal(20000));
    const volatil = liquidezPorReservaRecomendada(new Decimal(20000), new Decimal(60000));
    expect(estavel.valor).toBe(100);
    expect(volatil.valor).toBeCloseTo(33.33, 1);
    expect(estavel.faixa).not.toBe(volatil.faixa);
  });
});

describe("protecaoCompleta", () => {
  /**
   * A metade que faltava desde a Etapa 5. Enquanto `InsurancePolicy` não
   * existia, Proteção espelhava Liquidez e ficava em zero para quem tinha
   * seguro contratado — o que era simplesmente errado, e foi o que motivou
   * antecipar a Etapa 12 para dentro da 9-A.
   */
  it("pondera reserva e cobertura de seguros meio a meio", () => {
    expect(protecaoCompleta(100, 0).valor).toBe(50);
    expect(protecaoCompleta(0, 100).valor).toBe(50);
    expect(protecaoCompleta(60, 40).valor).toBe(50);
  });

  it("quem tem os dois chega ao topo", () => {
    expect(protecaoCompleta(100, 100).valor).toBe(100);
    expect(protecaoCompleta(100, 100).faixa).toBe("consolidado");
  });

  it("sem dado de seguro, o peso volta inteiro para a reserva", () => {
    // Ausência de dado não vira nota ruim — mesma disciplina do resto do PSF.
    expect(protecaoCompleta(80, null).valor).toBe(80);
    expect(protecaoCompleta(80, null).valor).toBe(protecao(80).valor);
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

describe("longevidade (§5.3.1)", () => {
  /**
   * Sem projeção salva não há aporte necessário com que comparar. Devolver
   * "crítico" aqui puniria o cliente por um trabalho que o consultor ainda não
   * fez — e "não avaliado" é um estado diferente, com representação própria.
   */
  it("sem projeção, é não avaliado — nunca faixa ruim", () => {
    const r = longevidade(null);
    expect(r.faixa).toBeNull();
    expect(r.valor).toBeNull();
  });

  it("aporte suficiente é consolidado", () => {
    expect(longevidade(100).faixa).toBe("consolidado");
  });

  it("aporte zero é crítico", () => {
    expect(longevidade(0).faixa).toBe("critico");
  });

  it("acompanha a suficiência calculada pelo PLA", () => {
    expect(longevidade(50).valor).toBe(50);
    expect(longevidade(50).faixa).toBe("em_construcao");
  });

  it("valor fora da escala é limitado, não propagado", () => {
    expect(longevidade(250).valor).toBe(100);
    expect(longevidade(-30).valor).toBe(0);
  });
});
