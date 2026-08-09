import { describe, expect, it } from "vitest";
import { parseItauFatura } from "@/lib/import/pdf-statement/parsers/itau";

describe("parseItauFatura — cartão Signature, sem parcela (conferido contra fatura real JAN25)", () => {
  const pages = [
    ["Vencimento: 10/01/2025", "Cartão 4831.XXXX.XXXX.8808"].join("\n"),
    [
      "Lançamentos: compras e saques",
      "LUIS F S HILDEBRAN (final 8808)",
      "DATA ESTABELECIMENTO VALOR EM R$",
      "13/12 CONECTCAR *Conectcar 50,00",
      "VEÍCULOS .ALPHAVILLE IN",
      "16/12 CONECTCAR *Conectcar 50,00",
      "VEÍCULOS .ALPHAVILLE IN",
      "Lançamentos no cartão (final 8808) 100,00",
      "Total dos lançamentos atuais 100,00",
    ].join("\n"),
  ];

  it("compra sem parcela vira despesa, descrição sem a linha de continuação (categoria/cidade)", () => {
    const result = parseItauFatura(pages);
    expect(result).toHaveLength(2);
    expect(result[0].description).toBe("CONECTCAR *Conectcar");
    expect(result[0].amount.toNumber()).toBe(-50);
    expect(result[0].installmentNumber).toBeNull();
  });

  it("mês da transação maior que o mês de vencimento -> ano anterior ao do vencimento", () => {
    const [t] = parseItauFatura(pages);
    expect(t.postedDate.toISOString().slice(0, 10)).toBe("2024-12-13");
  });

  it("subtotal 'Lançamentos no cartão' e 'Total dos lançamentos atuais' não viram transação", () => {
    const totals = parseItauFatura(pages).filter((t) => t.description.includes("Total") || t.description.includes("Lançamentos"));
    expect(totals).toHaveLength(0);
  });
});

describe("parseItauFatura — cartão PDA, múltiplos portadores e parcela sem separador fixo (conferido contra fatura real MAR24)", () => {
  const pages = [
    ["Vencimento: 09/03/2024"].join("\n"),
    [
      "Lançamentos: compras e saques",
      "LUIS S HILDEBRANDO (final 2261)",
      "DATA ESTABELECIMENTO VALOR EM R$",
      "29/06 MP *QCONCURSOS 09/12 18,90",
      "DIVERSOS .RIO DE JANEI",
      "21/09 Eduzz *Eduzz06/12 7,99",
      "EDUCAÇÃO .Sorocaba",
      "Lançamentos no cartão (final 2261) 26,89",
      "DANIELA HILDEBRANDO (final 3581)",
      "DATA ESTABELECIMENTO VALOR EM R$",
      "04/09 AUTO ESCOLA -CT RD06/06 26,60",
      "EDUCAÇÃO .RIBEIRAO PRET",
      "Lançamentos no cartão (final 3581) 26,60",
      "LUIS S HILDEBRANDO (final 1195)",
      "DATA ESTABELECIMENTO VALOR EM R$",
      "01/07 PG *ESTRATEGIACON 08/08 94,36",
      "EDUCAÇÃO .BRASILIA",
      "21/07 MERCADOLIVRE*PRO4C08/12 81,05",
      "EDUCAÇÃO .Osasco",
      "Lançamentos no cartão (final 1195) 175,41",
      "Compras parceladas - próximas faturas",
      "DATA ESTABELECIMENTO VALOR EM R$",
      "29/06 MP *QCONCURSOS 10/12 18,90",
      "21/07 MERCADOLIVRE*PRO4C09/12 81,05",
      "21/09 Eduzz *Eduzz07/12 7,99",
      "Total para próximas faturas 428,84",
    ].join("\n"),
  ];

  it("as 3 subseções (uma por portador) são todas lidas (2 + 1 + 2 transações)", () => {
    expect(parseItauFatura(pages)).toHaveLength(5);
  });

  it("contador de parcela com espaço antes ('09/12') é extraído e removido da descrição", () => {
    const [t] = parseItauFatura(pages).filter((t) => t.description.includes("QCONCURSOS"));
    expect(t.description).toBe("MP *QCONCURSOS");
    expect(t.installmentNumber).toBe(9);
    expect(t.installmentTotal).toBe(12);
  });

  it("contador de parcela grudado no nome ('Eduzz06/12') também é extraído", () => {
    const [t] = parseItauFatura(pages).filter((t) => t.description.startsWith("Eduzz"));
    expect(t.description).toBe("Eduzz *Eduzz");
    expect(t.installmentNumber).toBe(6);
    expect(t.installmentTotal).toBe(12);
  });

  it("contador de parcela grudado após dígito no nome ('PRO4C08/12') não confunde o '4' com parte da parcela", () => {
    const [t] = parseItauFatura(pages).filter((t) => t.description.includes("MERCADOLIVRE"));
    expect(t.description).toBe("MERCADOLIVRE*PRO4C");
    expect(t.installmentNumber).toBe(8);
    expect(t.installmentTotal).toBe(12);
  });

  it("seção 'Compras parceladas - próximas faturas' é ignorada (não duplica com número de parcela incrementado)", () => {
    const result = parseItauFatura(pages);
    const futureDuplicate = result.find((t) => t.installmentNumber === 10 && t.description.includes("QCONCURSOS"));
    expect(futureDuplicate).toBeUndefined();
    expect(result).toHaveLength(5);
  });

  it("linha de continuação (categoria/cidade) nunca vira uma transação própria", () => {
    const result = parseItauFatura(pages);
    expect(result.some((t) => t.description.includes("DIVERSOS") || t.description.includes("EDUCAÇÃO"))).toBe(false);
  });
});

describe("parseItauFatura — sem 'Vencimento:' em lugar nenhum", () => {
  it("devolve lista vazia (não quebra)", () => {
    const pages = [["Lançamentos: compras e saques", "DATA ESTABELECIMENTO VALOR EM R$", "13/12 LOJA 50,00", "Lançamentos no cartão (final 1) 50,00"].join("\n")];
    expect(parseItauFatura(pages)).toHaveLength(0);
  });
});
