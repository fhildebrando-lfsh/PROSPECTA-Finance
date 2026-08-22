import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  CHECKLIST_PCP,
  CUSTO_INVENTARIO_PADRAO_PCT,
  ITCMD_PADRAO_PCT,
  checklistProgress,
  successionLiquidityTest,
  type ChecklistState,
} from "@/lib/method/pcp";

function todosMarcados(): ChecklistState {
  return Object.fromEntries(CHECKLIST_PCP.map((i) => [i.key, true]));
}

describe("checklist do PCP", () => {
  it("as chaves são únicas — elas viram índice dentro do Deliverable", () => {
    const keys = CHECKLIST_PCP.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("todo item diz por que existe, para não virar burocracia", () => {
    for (const i of CHECKLIST_PCP) {
      expect(i.porque.length, i.key).toBeGreaterThan(20);
      expect(i.label.endsWith("?"), i.key).toBe(true);
    }
  });

  it("cobre as quatro frentes que falham por motivos diferentes", () => {
    const grupos = new Set(CHECKLIST_PCP.map((i) => i.group));
    expect([...grupos].sort()).toEqual(["COMUNICACAO", "DOCUMENTOS", "ESTRUTURA", "LIQUIDEZ"]);
  });
});

describe("checklistProgress (§5.3.1 — indicador Continuidade)", () => {
  it("estado vazio é zero por cento, e tudo fica pendente", () => {
    const r = checklistProgress({});
    expect(r.concluidos).toBe(0);
    expect(r.percentual).toBe(0);
    expect(r.pendentes).toHaveLength(CHECKLIST_PCP.length);
  });

  it("tudo marcado é cem por cento", () => {
    const r = checklistProgress(todosMarcados());
    expect(r.percentual).toBe(100);
    expect(r.pendentes).toEqual([]);
  });

  it("conta só o que está de fato marcado como verdadeiro", () => {
    const estado: ChecklistState = { testamento: true, procuracao: false };
    const r = checklistProgress(estado);
    expect(r.concluidos).toBe(1);
    expect(r.pendentes.some((p) => p.key === "procuracao")).toBe(true);
  });

  /**
   * O que permite acrescentar uma pergunta ao checklist sem corromper um PCP
   * antigo: chave desconhecida é ignorada, e item novo entra como pendente.
   */
  it("chave desconhecida no estado gravado é ignorada", () => {
    const estado = { ...todosMarcados(), pergunta_que_nao_existe_mais: true };
    expect(checklistProgress(estado).percentual).toBe(100);
  });

  it("valor que não é booleano verdadeiro não conta como concluído", () => {
    const estado = { testamento: "sim" } as unknown as ChecklistState;
    expect(checklistProgress(estado).concluidos).toBe(0);
  });
});

describe("teste de liquidez sucessória", () => {
  const zero = new Decimal(0);

  it("usa as alíquotas declaradas, e elas são parâmetro", () => {
    expect(ITCMD_PADRAO_PCT).toBe(4);
    expect(CUSTO_INVENTARIO_PADRAO_PCT).toBe(6);

    const r = successionLiquidityTest({
      patrimonioInventariavel: new Decimal(1_000_000),
      liquidezDisponivel: zero,
      seguroDeVida: zero,
    });
    expect(r.custoItcmd.toFixed(2)).toBe("40000.00");
    expect(r.custoInventario.toFixed(2)).toBe("60000.00");
    expect(r.custoTotal.toFixed(2)).toBe("100000.00");
  });

  /** O ITCMD é estadual e vai de 2% a 8% — o padrão não é afirmação sobre o caso. */
  it("aceita alíquota diferente, porque o imposto é estadual", () => {
    const r = successionLiquidityTest(
      { patrimonioInventariavel: new Decimal(1_000_000), liquidezDisponivel: zero, seguroDeVida: zero },
      8,
      6,
    );
    expect(r.custoItcmd.toFixed(2)).toBe("80000.00");
  });

  it("liquidez suficiente aprova o teste", () => {
    const r = successionLiquidityTest({
      patrimonioInventariavel: new Decimal(1_000_000),
      liquidezDisponivel: new Decimal(150_000),
      seguroDeVida: zero,
    });
    expect(r.aprovado).toBe(true);
    expect(r.deficit.toFixed(2)).toBe("0.00");
    expect(r.explicacao).toContain("sem precisar vender bens");
  });

  /** Seguro de vida não entra em inventário e chega antes dele. */
  it("o seguro de vida conta como recurso disponível", () => {
    const semSeguro = successionLiquidityTest({
      patrimonioInventariavel: new Decimal(1_000_000),
      liquidezDisponivel: new Decimal(20_000),
      seguroDeVida: zero,
    });
    const comSeguro = successionLiquidityTest({
      patrimonioInventariavel: new Decimal(1_000_000),
      liquidezDisponivel: new Decimal(20_000),
      seguroDeVida: new Decimal(100_000),
    });

    expect(semSeguro.aprovado).toBe(false);
    expect(comSeguro.aprovado).toBe(true);
  });

  it("déficit diz quanto do patrimônio teria de ser vendido às pressas", () => {
    const r = successionLiquidityTest({
      patrimonioInventariavel: new Decimal(1_000_000),
      liquidezDisponivel: new Decimal(40_000),
      seguroDeVida: zero,
    });
    expect(r.deficit.toFixed(2)).toBe("60000.00");
    expect(r.percentualDoPatrimonioAVender).toBeCloseTo(6, 1);
    expect(r.explicacao).toContain("com desconto");
  });

  /** Sobra não vira número negativo, que leria como crédito. */
  it("recursos de sobra não produzem déficit negativo", () => {
    const r = successionLiquidityTest({
      patrimonioInventariavel: new Decimal(100_000),
      liquidezDisponivel: new Decimal(500_000),
      seguroDeVida: zero,
    });
    expect(r.deficit.toFixed(2)).toBe("0.00");
    expect(r.percentualDoPatrimonioAVender).toBe(0);
  });

  it("patrimônio zero não divide por zero", () => {
    const r = successionLiquidityTest({
      patrimonioInventariavel: zero,
      liquidezDisponivel: zero,
      seguroDeVida: zero,
    });
    expect(r.custoTotal.toFixed(2)).toBe("0.00");
    expect(r.aprovado).toBe(true);
    expect(r.percentualDoPatrimonioAVender).toBe(0);
  });
});
