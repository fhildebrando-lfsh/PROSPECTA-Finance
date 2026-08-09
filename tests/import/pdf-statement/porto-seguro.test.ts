import { describe, expect, it } from "vitest";
import { parsePortoSeguroFatura } from "@/lib/import/pdf-statement/parsers/porto-seguro";

describe("parsePortoSeguroFatura — formato real (conferido contra 3 faturas de 2025-2026)", () => {
  const pages = [
    [
      "Luis Hildebrando",
      "Cartão 4466 90** **** *112",
      "Esta fatura vence em",
      "10/08/2026",
      "O valor total é",
      "R$ 158,52",
    ].join("\n"),
    [
      "Detalhamento",
      "da fatura",
      "Lançamentos: compras e saques",
      "Luis Hildebrando (final *112)",
      "Data Estabelecimento Valor em R$",
      "08/07 CONECTCAR FATURA 11,00",
      "18/07 IG GOELECTRICem Sao Caetano d BR 81,23",
      "21/07 IG GOELECTRICem Sao Caetano d BR 66,29",
      "Lançamentos no cartão (final *112) 158,52",
      "Contestações poderão ser feitas em até 60 dias para compras nacionais e 45 para internacionais, a partir da data do vencimento.",
    ].join("\n"),
  ];

  it("compra normal sem sinal vira despesa, mesmo ano do vencimento", () => {
    const [t] = parsePortoSeguroFatura(pages).filter((t) => t.description === "CONECTCAR FATURA");
    expect(t.amount.toNumber()).toBe(-11);
    expect(t.postedDate.toISOString().slice(0, 10)).toBe("2026-07-08");
    expect(t.installmentNumber).toBeNull();
  });

  it("linha de subtotal ('Lançamentos no cartão...') não é confundida com transação", () => {
    const total = parsePortoSeguroFatura(pages).filter((t) => t.description.includes("Lançamentos no cartão"));
    expect(total).toHaveLength(0);
  });

  it("total de transações extraídas bate (3 compras, sem o subtotal)", () => {
    expect(parsePortoSeguroFatura(pages)).toHaveLength(3);
  });
});

describe("parsePortoSeguroFatura — pagamento/desconto com sinal '-' grudado no valor", () => {
  const pages = [
    ["Esta fatura vence em", "10/01/2026", "O valor total é", "R$ 3.426,65"].join("\n"),
    [
      "Detalhamento",
      "Lançamentos: compras e saques",
      "Data Estabelecimento Valor em R$",
      "04/12 PORTO SEGURO AUTO 3.386,65",
      "20/01 DESCONTO SEGURO AUTO PORTO -165,99",
      "08/01 PAGAMENTO -3.426,65",
      "Lançamentos no cartão (final *112) 3.426,65",
      "Contestações poderão ser feitas em até 60 dias.",
    ].join("\n"),
  ];

  it("'PAGAMENTO' nunca é importado (não é compra nem estorno, é quitação da fatura)", () => {
    const pagamentos = parsePortoSeguroFatura(pages).filter((t) => t.description.startsWith("PAGAMENTO"));
    expect(pagamentos).toHaveLength(0);
  });

  it("desconto também usa o sinal '-' antes do valor e vira receita", () => {
    const [t] = parsePortoSeguroFatura(pages).filter((t) => t.description.includes("DESCONTO"));
    expect(t.amount.toNumber()).toBe(165.99);
  });

  it("transação de dezembro (mês > mês de vencimento) fica no ano anterior ao do vencimento", () => {
    const [t] = parsePortoSeguroFatura(pages).filter((t) => t.description.includes("PORTO SEGURO AUTO"));
    expect(t.postedDate.toISOString().slice(0, 10)).toBe("2025-12-04");
  });
});

describe("parsePortoSeguroFatura — sem 'vence em' em lugar nenhum", () => {
  it("devolve lista vazia (não quebra)", () => {
    const pages = [["Lançamentos: compras e saques", "Data Estabelecimento Valor em R$", "08/07 LOJA 11,00", "Contestações"].join("\n")];
    expect(parsePortoSeguroFatura(pages)).toHaveLength(0);
  });
});
