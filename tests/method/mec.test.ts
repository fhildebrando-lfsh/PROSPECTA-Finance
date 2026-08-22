import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  CET_TOXICO_PCT,
  MODALIDADES_TOXICAS,
  classifyToxic,
  orientacoes,
  rankByCost,
  summarize,
  type DebtInput,
} from "@/lib/method/mec";

function d(over: Partial<DebtInput> = {}): DebtInput {
  return {
    id: over.id ?? "x",
    creditorName: "Banco X",
    modality: "Empréstimo pessoal",
    outstandingBalance: new Decimal(1000),
    cetAnnualPercent: new Decimal(30),
    hasNegativacao: false,
    hasLegalAction: false,
    status: "EM_DIA",
    ...over,
  };
}

describe("classifyToxic (§9.6)", () => {
  it("as duas modalidades nomeadas pela Metodologia são tóxicas por natureza", () => {
    expect(MODALIDADES_TOXICAS).toEqual(["Rotativo do cartão", "Cheque especial"]);
    for (const m of MODALIDADES_TOXICAS) {
      // Tóxica mesmo com CET baixo declarado: a modalidade basta.
      const v = classifyToxic({ modality: m, cetAnnualPercent: new Decimal(10) });
      expect(v.isToxic, m).toBe(true);
    }
  });

  /** "Juros compostos em patamares de três dígitos ao ano" — 100 é o piso literal. */
  it("CET de três dígitos torna qualquer modalidade tóxica", () => {
    expect(CET_TOXICO_PCT).toBe(100);
    expect(classifyToxic({ modality: "Consignado", cetAnnualPercent: new Decimal(100) }).isToxic).toBe(true);
    expect(classifyToxic({ modality: "Consignado", cetAnnualPercent: new Decimal(99.99) }).isToxic).toBe(false);
  });

  it("sem CET informado, só a modalidade decide", () => {
    expect(classifyToxic({ modality: "Consignado", cetAnnualPercent: null }).isToxic).toBe(false);
    expect(classifyToxic({ modality: "Cheque especial", cetAnnualPercent: null }).isToxic).toBe(true);
  });

  /** A tela mostra o porquê — rótulo sem motivo não ajuda ninguém a decidir. */
  it("sempre diz por que classificou assim", () => {
    const v = classifyToxic({ modality: "Rotativo do cartão", cetAnnualPercent: new Decimal(400) });
    expect(v.motivos).toHaveLength(2);
    expect(v.motivos.join(" ")).toContain("400%");
  });
});

describe("rankByCost (§10)", () => {
  it("ordena por custo, não por saldo", () => {
    const r = rankByCost([
      d({ id: "grande-barata", outstandingBalance: new Decimal(50000), cetAnnualPercent: new Decimal(12) }),
      d({ id: "pequena-cara", outstandingBalance: new Decimal(800), cetAnnualPercent: new Decimal(80) }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["pequena-cara", "grande-barata"]);
    expect(r[0].ordem).toBe(1);
  });

  it("tóxica vem antes mesmo de CET nominal maior", () => {
    const r = rankByCost([
      d({ id: "cara-comum", cetAnnualPercent: new Decimal(90) }),
      d({ id: "cheque", modality: "Cheque especial", cetAnnualPercent: new Decimal(50) }),
    ]);
    expect(r[0].id).toBe("cheque");
  });

  /**
   * O ponto que mais importa aqui: ausência de CET **não** é custo zero.
   * Ordenar a sem-dado à frente sugeriria que é barata.
   */
  it("dívida sem CET vai para o fim entre as não-tóxicas", () => {
    const r = rankByCost([
      d({ id: "sem-cet", cetAnnualPercent: null }),
      d({ id: "com-cet-baixo", cetAnnualPercent: new Decimal(5) }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["com-cet-baixo", "sem-cet"]);
  });

  it("quitada sai do mapa", () => {
    const r = rankByCost([d({ id: "viva" }), d({ id: "morta", status: "QUITADO" })]);
    expect(r.map((x) => x.id)).toEqual(["viva"]);
  });

  it("negativada e renegociada continuam no mapa", () => {
    const r = rankByCost([d({ id: "a", status: "NEGATIVADO" }), d({ id: "b", status: "RENEGOCIADO" })]);
    expect(r).toHaveLength(2);
  });

  /** Ordem determinística: duas iguais não podem trocar de lugar a cada carga. */
  it("empate de custo desempata por saldo, de forma estável", () => {
    const entrada = [
      d({ id: "menor", outstandingBalance: new Decimal(100), cetAnnualPercent: new Decimal(20) }),
      d({ id: "maior", outstandingBalance: new Decimal(900), cetAnnualPercent: new Decimal(20) }),
    ];
    expect(rankByCost(entrada).map((x) => x.id)).toEqual(["maior", "menor"]);
    expect(rankByCost([...entrada].reverse()).map((x) => x.id)).toEqual(["maior", "menor"]);
  });

  it("lista vazia não quebra", () => {
    expect(rankByCost([])).toEqual([]);
  });
});

describe("summarize", () => {
  it("separa o total tóxico do total geral", () => {
    const r = rankByCost([
      d({ id: "a", modality: "Cheque especial", outstandingBalance: new Decimal(2000) }),
      d({ id: "b", outstandingBalance: new Decimal(3000) }),
    ]);
    const s = summarize(r);
    expect(s.totalEmAberto.toFixed(2)).toBe("5000.00");
    expect(s.totalToxico.toFixed(2)).toBe("2000.00");
    expect(s.quantidadeToxica).toBe(1);
  });

  it("conta as sem CET, que é o dado que mais falta", () => {
    const s = summarize(rankByCost([d({ id: "a", cetAnnualPercent: null }), d({ id: "b" })]));
    expect(s.semCet).toBe(1);
  });

  it("sinaliza negativação e ação judicial", () => {
    const s = summarize(rankByCost([d({ hasNegativacao: true }), d({ id: "y", hasLegalAction: true })]));
    expect(s.temNegativacao).toBe(true);
    expect(s.temAcaoJudicial).toBe(true);
  });
});

describe("orientacoes", () => {
  it("aponta por onde começar, nomeando o credor", () => {
    const r = rankByCost([d({ creditorName: "Banco Caro", cetAnnualPercent: new Decimal(120) })]);
    expect(orientacoes(r, summarize(r))[0]).toContain("Banco Caro");
  });

  it("ação judicial precede a ordem de custo", () => {
    const r = rankByCost([d({ hasLegalAction: true })]);
    expect(orientacoes(r, summarize(r)).join(" ")).toContain("prazo próprio");
  });

  it("sem dívida, diz isso e não inventa recomendação", () => {
    const r = rankByCost([]);
    expect(orientacoes(r, summarize(r))).toEqual(["Nenhuma dívida em aberto registrada."]);
  });
});
