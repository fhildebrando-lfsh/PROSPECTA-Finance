import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import {
  ALLOCATION_BANDS,
  bandForIncome,
  compareToBand,
  computeAllocation,
  percentOfIncome,
  type AllocationEntry,
} from "@/lib/method/allocation";

let counter = 0;
function makeEntry(overrides: Partial<AllocationEntry> = {}): AllocationEntry {
  counter += 1;
  return {
    id: `entry-${counter}`,
    nature: "DESPESA",
    amount: new Decimal(-100),
    transactionDate: new Date(Date.UTC(2026, 0, 15)),
    dueDate: new Date(Date.UTC(2026, 0, 15)),
    status: "PAGO",
    categorySlug: "1_alimentacao",
    walletKindCode: "CONTA_BANCARIA",
    macroBloco: "ESSENCIAL",
    ...overrides,
  };
}

const JANEIRO_2026 = { start: new Date(Date.UTC(2026, 0, 1)), end: new Date(Date.UTC(2026, 0, 31)) };

describe("computeAllocation (Régua de Alocação — §11.2)", () => {
  it("soma DESPESA por macroBloco em valor absoluto", () => {
    const entries = [
      makeEntry({ macroBloco: "ESSENCIAL", amount: new Decimal(-1000) }),
      makeEntry({ macroBloco: "ESTILO_DE_VIDA", amount: new Decimal(-300) }),
      makeEntry({ macroBloco: "OBRIGACAO", amount: new Decimal(-500) }),
    ];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.essencial.toNumber()).toBe(1000);
    expect(totals.estiloDeVida.toNumber()).toBe(300);
    expect(totals.obrigacao.toNumber()).toBe(500);
  });

  it("DESPESA sem macroBloco (subcategoria não classificada) vira naoClassificado, nunca some", () => {
    const entries = [makeEntry({ macroBloco: null, amount: new Decimal(-200) })];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.naoClassificado.toNumber()).toBe(200);
    expect(totals.essencial.toNumber()).toBe(0);
  });

  it("Poupança = aportes de INVESTIMENTO (fórmula b, soma direta)", () => {
    const entries = [makeEntry({ nature: "INVESTIMENTO", amount: new Decimal(800), macroBloco: null })];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.poupanca.toNumber()).toBe(800);
  });

  it("retirada de investimento (amount negativo) reduz a Poupança do período", () => {
    const entries = [makeEntry({ nature: "INVESTIMENTO", amount: new Decimal(-300), macroBloco: null })];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.poupanca.toNumber()).toBe(-300);
  });

  it("Poupança = transferência OUTRO/Transferências pra carteira CONTA_CAIXA (perna de entrada, amount > 0)", () => {
    const entries = [
      makeEntry({
        nature: "OUTRO",
        categorySlug: "transferencias",
        walletKindCode: "CONTA_CAIXA",
        amount: new Decimal(500),
        macroBloco: null,
      }),
    ];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.poupanca.toNumber()).toBe(500);
  });

  it("perna de SAÍDA da mesma transferência (amount negativo) não conta como Poupança", () => {
    const entries = [
      makeEntry({
        nature: "OUTRO",
        categorySlug: "transferencias",
        walletKindCode: "CONTA_BANCARIA", // origem, não é a caixinha
        amount: new Decimal(-500),
        macroBloco: null,
      }),
    ];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.poupanca.toNumber()).toBe(0);
  });

  it("transferência pra carteira que NÃO é caixinha não conta como Poupança", () => {
    const entries = [
      makeEntry({
        nature: "OUTRO",
        categorySlug: "transferencias",
        walletKindCode: "CONTA_BANCARIA",
        amount: new Decimal(500),
        macroBloco: null,
      }),
    ];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.poupanca.toNumber()).toBe(0);
  });

  it("RECEITA soma no total receita, fora dos 4 blocos", () => {
    const entries = [makeEntry({ nature: "RECEITA", amount: new Decimal(5000), macroBloco: null })];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.receita.toNumber()).toBe(5000);
    expect(totals.essencial.toNumber()).toBe(0);
  });

  it("respeita settlement — pending não soma entries PAGO/RECEBIDO", () => {
    const entries = [makeEntry({ status: "PAGO", amount: new Decimal(-100) })];
    const totals = computeAllocation(entries, JANEIRO_2026, "pending");
    expect(totals.essencial.toNumber()).toBe(0);
  });

  it("fora do período não entra na soma", () => {
    const entries = [makeEntry({ dueDate: new Date(Date.UTC(2026, 1, 1)), amount: new Decimal(-999) })];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    expect(totals.essencial.toNumber()).toBe(0);
  });
});

describe("percentOfIncome", () => {
  it("calcula % de cada bloco sobre a receita", () => {
    const entries = [
      makeEntry({ nature: "RECEITA", amount: new Decimal(10000), macroBloco: null }),
      makeEntry({ macroBloco: "ESSENCIAL", amount: new Decimal(-6000) }),
      makeEntry({ macroBloco: "ESTILO_DE_VIDA", amount: new Decimal(-2000) }),
    ];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    const pct = percentOfIncome(totals);
    expect(pct.essencial).toBe(60);
    expect(pct.estiloDeVida).toBe(20);
  });

  it("naoAlocado é o resíduo — nunca escondido dentro de outro bloco", () => {
    const entries = [
      makeEntry({ nature: "RECEITA", amount: new Decimal(1000), macroBloco: null }),
      makeEntry({ macroBloco: "ESSENCIAL", amount: new Decimal(-400) }),
    ];
    const totals = computeAllocation(entries, JANEIRO_2026, "settled");
    const pct = percentOfIncome(totals);
    expect(pct.essencial).toBe(40);
    expect(pct.naoAlocado).toBe(60);
  });

  it("receita zero ou negativa retorna tudo zerado, sem dividir por zero", () => {
    const totals = computeAllocation([], JANEIRO_2026, "settled");
    const pct = percentOfIncome(totals);
    expect(pct).toEqual({ essencial: 0, estiloDeVida: 0, obrigacao: 0, poupanca: 0, naoClassificado: 0, naoAlocado: 0 });
  });
});

describe("bandForIncome (§11.3 — bandas de referência)", () => {
  it("classifica cada faixa de renda na banda certa", () => {
    expect(bandForIncome(new Decimal(2000)).label).toBe(ALLOCATION_BANDS[0].label);
    expect(bandForIncome(new Decimal(4000)).label).toBe(ALLOCATION_BANDS[1].label);
    expect(bandForIncome(new Decimal(8000)).label).toBe(ALLOCATION_BANDS[2].label);
    expect(bandForIncome(new Decimal(20000)).label).toBe(ALLOCATION_BANDS[3].label);
    expect(bandForIncome(new Decimal(100000)).label).toBe(ALLOCATION_BANDS[4].label);
  });

  it("limite exato de uma faixa cai na própria faixa (inclusivo)", () => {
    expect(bandForIncome(new Decimal(3000)).label).toBe(ALLOCATION_BANDS[0].label);
  });

  it("renda acima de todas as faixas cai na última (sem teto)", () => {
    expect(bandForIncome(new Decimal(1_000_000)).maxIncome).toBeNull();
  });
});

describe("compareToBand", () => {
  it("classifica abaixo/dentro/acima de uma faixa [min, max]", () => {
    expect(compareToBand(50, [60, 80])).toBe("abaixo");
    expect(compareToBand(70, [60, 80])).toBe("dentro");
    expect(compareToBand(90, [60, 80])).toBe("acima");
  });

  it("limites da faixa contam como dentro (inclusivo dos dois lados)", () => {
    expect(compareToBand(60, [60, 80])).toBe("dentro");
    expect(compareToBand(80, [60, 80])).toBe("dentro");
  });
});
