import { describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
import { clusterInstallmentRows, type InstallmentRowForGrouping } from "@/lib/import/group-installments";

function row(overrides: Partial<InstallmentRowForGrouping> = {}): InstallmentRowForGrouping {
  return {
    walletId: "w1",
    categoryId: "c1",
    description: "CASAS BAHIA",
    installmentNumber: 1,
    installmentTotal: 24,
    amount: new Decimal(-100),
    ...overrides,
  };
}

describe("clusterInstallmentRows (backfill/importação de parcelamento)", () => {
  it("agrupa linhas com mesma carteira/categoria/descrição/total como um cluster seguro", () => {
    const rows = [
      row({ installmentNumber: 1 }),
      row({ installmentNumber: 2 }),
      row({ installmentNumber: 3 }),
    ];
    const { safe, ambiguous } = clusterInstallmentRows(rows);
    expect(safe).toHaveLength(1);
    expect(safe[0]).toHaveLength(3);
    expect(ambiguous).toHaveLength(0);
  });

  it("ignora acentuação/maiúsculas na descrição (mesma normalização de slugify)", () => {
    const rows = [row({ description: "Casas Bahia", installmentNumber: 1 }), row({ description: "CASAS BAHIA", installmentNumber: 2 })];
    const { safe } = clusterInstallmentRows(rows);
    expect(safe).toHaveLength(1);
    expect(safe[0]).toHaveLength(2);
  });

  it("separa clusters diferentes por carteira, categoria, descrição ou total (5 clusters de 1 linha cada)", () => {
    const rows = [
      row({ walletId: "w1", installmentNumber: 1 }),
      row({ walletId: "w2", installmentNumber: 1 }),
      row({ categoryId: "c2", installmentNumber: 1 }),
      row({ description: "OUTRA LOJA", installmentNumber: 1 }),
      row({ installmentTotal: 12, installmentNumber: 1 }),
    ];
    const { safe, ambiguous } = clusterInstallmentRows(rows);
    expect(safe).toHaveLength(5);
    expect(safe.every((cluster) => cluster.length === 1)).toBe(true);
    expect(ambiguous).toHaveLength(0);
  });

  it("marca como ambíguo um cluster com número de parcela repetido", () => {
    const rows = [row({ installmentNumber: 1 }), row({ installmentNumber: 1 }), row({ installmentNumber: 2 })];
    const { safe, ambiguous } = clusterInstallmentRows(rows);
    expect(safe).toHaveLength(0);
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0]).toHaveLength(3);
  });

  it("ignora linhas sem parcelamento de verdade (installmentTotal < 2, ausente, ou installmentNumber ausente)", () => {
    const rows = [
      row({ installmentTotal: null, installmentNumber: null }),
      row({ installmentTotal: 1, installmentNumber: 1 }),
    ];
    const { safe, ambiguous } = clusterInstallmentRows(rows);
    expect(safe).toHaveLength(0);
    expect(ambiguous).toHaveLength(0);
  });

  it("separa duas compras diferentes com a mesma loja/total em clusters seguros, por valor da parcela (bug real: MERCADO LIVRE)", () => {
    const rows = [
      row({ description: "MERCADO LIVRE", installmentNumber: 1, amount: new Decimal(-88.24) }),
      row({ description: "MERCADO LIVRE", installmentNumber: 2, amount: new Decimal(-88.24) }),
      row({ description: "MERCADO LIVRE", installmentNumber: 1, amount: new Decimal(-474.92) }),
      row({ description: "MERCADO LIVRE", installmentNumber: 2, amount: new Decimal(-474.92) }),
    ];
    const { safe, ambiguous } = clusterInstallmentRows(rows);
    expect(ambiguous).toHaveLength(0);
    expect(safe).toHaveLength(2);
    expect(safe.map((c) => c.length).sort()).toEqual([2, 2]);
    // cada subgrupo continua homogêneo por valor
    for (const cluster of safe) {
      const amounts = new Set(cluster.map((r) => r.amount.toString()));
      expect(amounts.size).toBe(1);
    }
  });

  it("não separa a mesma compra por causa do centavo de resto entre parcelas (tolerância de 2 centavos)", () => {
    const rows = [
      row({ installmentNumber: 1, amount: new Decimal(-53.98) }),
      row({ installmentNumber: 2, amount: new Decimal(-53.96) }),
      row({ installmentNumber: 3, amount: new Decimal(-53.96) }),
    ];
    const { safe, ambiguous } = clusterInstallmentRows(rows);
    expect(ambiguous).toHaveLength(0);
    expect(safe).toHaveLength(1);
    expect(safe[0]).toHaveLength(3);
  });

  it("continua ambíguo quando duas séries diferentes coincidem também no valor da parcela", () => {
    const rows = [row({ installmentNumber: 1 }), row({ installmentNumber: 1 }), row({ installmentNumber: 2 })];
    const { safe, ambiguous } = clusterInstallmentRows(rows);
    expect(safe).toHaveLength(0);
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0]).toHaveLength(3);
  });
});
