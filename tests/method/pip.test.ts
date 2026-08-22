import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  buildPolicyMap,
  classifyBand,
  foraDaFaixa,
  semPolitica,
  validatePolicy,
  type PolicyBand,
  type Position,
} from "@/lib/method/pip";

function banda(classCode: string, min: number, max: number): PolicyBand {
  return {
    classCode,
    classLabel: classCode,
    minPercent: new Decimal(min),
    maxPercent: new Decimal(max),
  };
}

function pos(classCode: string, valor: number): Position {
  return { classCode, classLabel: classCode, currentValue: new Decimal(valor) };
}

describe("classifyBand", () => {
  const b = banda("RF", 40, 60);

  it("dentro da faixa não é desvio", () => {
    expect(classifyBand(50, b)).toEqual({ status: "DENTRO", desvioPp: 0 });
  });

  /** A borda pertence à faixa: em 40% ainda se está dentro, não abaixo. */
  it("as bordas contam como dentro", () => {
    expect(classifyBand(40, b).status).toBe("DENTRO");
    expect(classifyBand(60, b).status).toBe("DENTRO");
  });

  it("mede a distância até a borda mais próxima", () => {
    expect(classifyBand(30, b)).toEqual({ status: "ABAIXO", desvioPp: 10 });
    expect(classifyBand(75, b)).toEqual({ status: "ACIMA", desvioPp: 15 });
  });
});

describe("buildPolicyMap", () => {
  it("calcula o percentual de cada classe sobre o total", () => {
    const rows = buildPolicyMap([pos("RF", 60), pos("RV", 40)], [banda("RF", 40, 60), banda("RV", 40, 60)]);
    expect(rows.find((r) => r.classCode === "RF")!.actualPercent).toBe(60);
    expect(rows.find((r) => r.classCode === "RV")!.actualPercent).toBe(40);
  });

  it("diz quanto mover para voltar à borda da faixa", () => {
    // 80% em RF com teto de 60%: precisa sair 20% de 100.000 = 20.000.
    const rows = buildPolicyMap([pos("RF", 80000), pos("RV", 20000)], [banda("RF", 40, 60)]);
    const rf = rows.find((r) => r.classCode === "RF")!;
    expect(rf.status).toBe("ACIMA");
    expect(rf.ajusteValor.toFixed(2)).toBe("-20000.00");
  });

  it("classe abaixo do mínimo pede entrada, com sinal positivo", () => {
    const rows = buildPolicyMap([pos("RF", 90000), pos("RV", 10000)], [banda("RV", 20, 40)]);
    const rv = rows.find((r) => r.classCode === "RV")!;
    expect(rv.status).toBe("ABAIXO");
    expect(rv.ajusteValor.toFixed(2)).toBe("10000.00");
  });

  it("dentro da faixa não pede ajuste nenhum", () => {
    const rows = buildPolicyMap([pos("RF", 50000), pos("RV", 50000)], [banda("RF", 40, 60)]);
    expect(rows.find((r) => r.classCode === "RF")!.ajusteValor.toFixed(2)).toBe("0.00");
  });

  /**
   * Dinheiro alocado fora da política é justamente o que o consultor precisa
   * ver. Omitir produziria uma soma que não fecha em 100%.
   */
  it("classe sem faixa aparece mesmo assim, marcada como fora da política", () => {
    const rows = buildPolicyMap([pos("RF", 50), pos("CRIPTO", 50)], [banda("RF", 40, 60)]);
    const cripto = rows.find((r) => r.classCode === "CRIPTO")!;
    expect(cripto.band).toBeNull();
    expect(cripto.status).toBeNull();
    expect(semPolitica(rows).map((r) => r.classCode)).toEqual(["CRIPTO"]);
  });

  /** "Você definiu 20% em renda variável e tem zero" é informação. */
  it("classe com faixa e sem posição aparece com zero", () => {
    const rows = buildPolicyMap([pos("RF", 100)], [banda("RF", 40, 60), banda("RV", 20, 40)]);
    const rv = rows.find((r) => r.classCode === "RV")!;
    expect(rv.actualPercent).toBe(0);
    expect(rv.status).toBe("ABAIXO");
  });

  it("soma posições da mesma classe", () => {
    const rows = buildPolicyMap([pos("RF", 30), pos("RF", 70)], [banda("RF", 90, 100)]);
    expect(rows).toHaveLength(1);
    expect(rows[0].actualPercent).toBe(100);
  });

  it("carteira vazia não divide por zero", () => {
    const rows = buildPolicyMap([], [banda("RF", 40, 60)]);
    expect(rows[0].actualPercent).toBe(0);
  });

  it("foraDaFaixa lista só o que precisa de ação", () => {
    const rows = buildPolicyMap(
      [pos("RF", 80), pos("RV", 20)],
      [banda("RF", 40, 60), banda("RV", 10, 30)],
    );
    expect(foraDaFaixa(rows).map((r) => r.classCode)).toEqual(["RF"]);
  });
});

describe("validatePolicy", () => {
  it("política coerente passa", () => {
    const v = validatePolicy([banda("RF", 40, 70), banda("RV", 20, 50)]);
    expect(v.valida).toBe(true);
    expect(v.erros).toEqual([]);
  });

  it("mínimo maior que máximo é erro", () => {
    const v = validatePolicy([banda("RF", 70, 40)]);
    expect(v.valida).toBe(false);
    expect(v.erros[0]).toContain("maior que o máximo");
  });

  /**
   * O ponto desta validação: uma política pode ser **aritmeticamente
   * impossível** sem que isso apareça ao preencher classe por classe.
   * Descobrir só no rebalanceamento seria descobrir tarde.
   */
  it("mínimos somando acima de 100% tornam a política impossível", () => {
    const v = validatePolicy([banda("RF", 60, 80), banda("RV", 50, 70)]);
    expect(v.valida).toBe(false);
    expect(v.erros.join(" ")).toContain("nenhuma carteira consegue cumprir");
  });

  it("máximos somando abaixo de 100% deixam dinheiro sem onde caber", () => {
    const v = validatePolicy([banda("RF", 10, 30), banda("RV", 10, 40)]);
    expect(v.valida).toBe(false);
    expect(v.erros.join(" ")).toContain("sem classe onde caber");
  });

  it("faixa fora de 0–100 é erro", () => {
    expect(validatePolicy([banda("RF", -5, 50)]).valida).toBe(false);
    expect(validatePolicy([banda("RF", 50, 120)]).valida).toBe(false);
  });

  /** Válida, mas operacionalmente ruim — vira aviso, não erro. */
  it("faixas sem folga viram aviso, não erro", () => {
    const v = validatePolicy([banda("RF", 60, 60), banda("RV", 40, 40)]);
    expect(v.valida).toBe(true);
    expect(v.avisos[0]).toContain("não têm folga");
  });

  it("política vazia não acusa nada", () => {
    expect(validatePolicy([])).toEqual({ erros: [], avisos: [], valida: true });
  });
});
