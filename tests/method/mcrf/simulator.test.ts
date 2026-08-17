import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import { deltaCobertura, deltaReserva, parseSimulation } from "@/lib/method/mcrf/simulator";

describe("parseSimulation (§43)", () => {
  it("sem parâmetro nenhum, não simula", () => {
    const r = parseSimulation({});
    expect(r.ativo).toBe(false);
    expect(r.hipoteses).toEqual([]);
    expect(r.overrides).toEqual({});
  });

  it("campo vazio não conta como hipótese", () => {
    // O formulário sempre envia todos os campos; os em branco chegam como "".
    const r = parseSimulation({ custoPct: "", rendaExtra: "", dividaQuitada: "", liquidezExtra: "" });
    expect(r.ativo).toBe(false);
    expect(r.ignorados).toEqual([]);
  });

  it("converte redução de custo de pontos percentuais para fração", () => {
    const r = parseSimulation({ custoPct: "10" });
    expect(r.overrides.reducaoCustoPct).toBe(0.1);
    expect(r.ativo).toBe(true);
    expect(r.hipoteses[0]).toContain("10%");
  });

  it("aceita vírgula como separador decimal", () => {
    const r = parseSimulation({ rendaExtra: "1234,56" });
    expect(r.overrides.rendaExtraMensal?.toFixed(2)).toBe("1234.56");
  });

  it("aceita ponto como separador decimal", () => {
    const r = parseSimulation({ rendaExtra: "1234.56" });
    expect(r.overrides.rendaExtraMensal?.toFixed(2)).toBe("1234.56");
  });

  it("zero não vira hipótese — é igual ao cálculo real", () => {
    const r = parseSimulation({ rendaExtra: "0", custoPct: "0" });
    expect(r.ativo).toBe(false);
    expect(r.overrides.rendaExtraMensal).toBeUndefined();
    expect(r.overrides.reducaoCustoPct).toBeUndefined();
    // Zero é entrada legítima, não erro: nada a avisar.
    expect(r.ignorados).toEqual([]);
  });

  it("valor negativo é descartado e o descarte é dito", () => {
    const r = parseSimulation({ rendaExtra: "-500" });
    expect(r.overrides.rendaExtraMensal).toBeUndefined();
    expect(r.ativo).toBe(false);
    expect(r.ignorados).toHaveLength(1);
    expect(r.ignorados[0]).toContain("Renda extra");
  });

  it("texto que não é número é descartado e o descarte é dito", () => {
    const r = parseSimulation({ liquidezExtra: "abc" });
    expect(r.overrides.liquidezExtra).toBeUndefined();
    expect(r.ignorados[0]).toContain("Liquidez extra");
  });

  it("redução de custo acima de 100% é recusada, não truncada em silêncio", () => {
    const r = parseSimulation({ custoPct: "150" });
    expect(r.overrides.reducaoCustoPct).toBeUndefined();
    expect(r.ativo).toBe(false);
    expect(r.ignorados[0]).toContain("0% e 100%");
  });

  it("as duas hipóteses booleanas só ligam com \"1\"", () => {
    expect(parseSimulation({ segundaAtividade: "1" }).overrides.forcarSegundaAtividadeResiliente).toBe(true);
    expect(parseSimulation({ seguroRenda: "1" }).overrides.contratarSeguro).toBe(true);
    // Checkbox desmarcado simplesmente não vem na URL; qualquer outro valor não liga.
    expect(parseSimulation({ segundaAtividade: "0" }).overrides.forcarSegundaAtividadeResiliente).toBeUndefined();
    expect(parseSimulation({ seguroRenda: "on" }).overrides.contratarSeguro).toBeUndefined();
  });

  it("combina várias hipóteses e lista todas", () => {
    const r = parseSimulation({
      custoPct: "15",
      rendaExtra: "2000",
      dividaQuitada: "800",
      liquidezExtra: "10000",
      segundaAtividade: "1",
      seguroRenda: "1",
    });
    expect(r.ativo).toBe(true);
    expect(r.hipoteses).toHaveLength(6);
    expect(r.overrides.reducaoCustoPct).toBe(0.15);
    expect(r.overrides.rendaExtraMensal?.toFixed(2)).toBe("2000.00");
    expect(r.overrides.dividaQuitadaMensal?.toFixed(2)).toBe("800.00");
    expect(r.overrides.liquidezExtra?.toFixed(2)).toBe("10000.00");
    expect(r.overrides.forcarSegundaAtividadeResiliente).toBe(true);
    expect(r.overrides.contratarSeguro).toBe(true);
  });

  it("uma hipótese válida junto de uma inválida: aplica a válida e avisa da outra", () => {
    const r = parseSimulation({ rendaExtra: "1000", custoPct: "200" });
    expect(r.ativo).toBe(true);
    expect(r.overrides.rendaExtraMensal?.toFixed(2)).toBe("1000.00");
    expect(r.overrides.reducaoCustoPct).toBeUndefined();
    expect(r.ignorados).toHaveLength(1);
  });

  it("não deixa chave com undefined no objeto de overrides", () => {
    const r = parseSimulation({ rendaExtra: "100" });
    expect(Object.keys(r.overrides)).toEqual(["rendaExtraMensal"]);
  });
});

describe("deltaReserva", () => {
  /** Precisar de menos reserva é melhora: é o mesmo grau de proteção com menos caixa parado. */
  it("reserva menor é melhora", () => {
    const d = deltaReserva(new Decimal(50000), new Decimal(42000));
    expect(d.diferenca.toFixed(2)).toBe("-8000.00");
    expect(d.melhor).toBe(true);
    expect(d.igual).toBe(false);
  });

  it("reserva maior é piora", () => {
    const d = deltaReserva(new Decimal(50000), new Decimal(58000));
    expect(d.melhor).toBe(false);
  });

  it("igual não é nem melhora nem piora", () => {
    const d = deltaReserva(new Decimal(50000), new Decimal(50000));
    expect(d.igual).toBe(true);
    expect(d.melhor).toBe(false);
  });
});

describe("deltaCobertura", () => {
  /** Aqui o sinal se inverte: mais meses de cobertura é melhor. */
  it("cobertura maior é melhora", () => {
    const d = deltaCobertura(4, 7);
    expect(d.diferenca.toFixed(0)).toBe("3");
    expect(d.melhor).toBe(true);
  });

  it("cobertura menor é piora", () => {
    expect(deltaCobertura(7, 4).melhor).toBe(false);
  });
});
