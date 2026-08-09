import { describe, expect, it } from "vitest";
import { parseCasasBahiaFatura } from "@/lib/import/pdf-statement/parsers/casas-bahia";

describe("parseCasasBahiaFatura — formato real (conferido contra 4 faturas de 2025-2026)", () => {
  const pages = [
    [
      "Fatura mensal",
      "Pág. 1 /3",
      "LUIS F S HILDEBRANDO",
      "CASAS BAHIA VISA PLATINUM 4766.07**.****.8019",
      "Total da fatura Vencimento Limite de compras Limite de saque",
      "R$ 162,00 10/05/2026 R$ 5.000,00 R$ 0,00",
      "23794.15009 91862.120937 81000.224501 1 00000000000000 237 - 2",
      "LUIS F S HILDEBRANDO 393.534.408-23 RUA VICENTE GOLFETO BLC MINAS GERAIS 251",
      "09/18621209381-4 0000172249 4150-5/0002245-4 R$",
    ].join("\n"),
    [
      "Fatura mensal",
      "Pág. 2 /3",
      "Lançamentos Total parcelado para as próximas faturas",
      "Data Descrição Valor R$",
      "Nacionais em Reais (R$)",
      "Próxima fatura R$ 162,00",
      "LUIS HILDEBRANDO 4766.07**.****.8019",
      "Demais faturas R$ 2.268,00 29/07 COMPRA PARCELADA CASAS BAHIA (09/24) 162,00",
      "08/04 PAGAMENTO RECEBIDO - OBRIGADO 162,00 -",
      "Total para as próximas faturas R$ 2.430,00",
      "Limites",
      "Total Utilizado Disponível em:",
      "26/04/2026",
      "Compras R$ 5.000,00 R$ 162,00 RS 4.838,00",
    ].join("\n"),
  ];

  it("compra parcelada extrai número/total da parcela e limpa a descrição, ano anterior ao de vencimento", () => {
    const [t] = parseCasasBahiaFatura(pages).filter((t) => t.description.includes("COMPRA"));
    expect(t.description).toBe("COMPRA PARCELADA CASAS BAHIA");
    expect(t.installmentNumber).toBe(9);
    expect(t.installmentTotal).toBe(24);
    expect(t.amount.toNumber()).toBe(-162);
    expect(t.postedDate.toISOString().slice(0, 10)).toBe("2025-07-29");
  });

  it("'PAGAMENTO RECEBIDO' nunca é importado (não é compra nem estorno, é quitação da fatura)", () => {
    const pagamentos = parseCasasBahiaFatura(pages).filter((t) => t.description.includes("PAGAMENTO"));
    expect(pagamentos).toHaveLength(0);
  });

  it("ignora números de boleto/CPF/código de barras da página 1 (sem falso positivo)", () => {
    expect(parseCasasBahiaFatura(pages)).toHaveLength(1);
  });

  it("texto de coluna vizinha colado antes da data ('Demais faturas R$ X,XX 29/07 ...') não contamina a descrição", () => {
    const [t] = parseCasasBahiaFatura(pages).filter((t) => t.description.includes("COMPRA"));
    expect(t.description).not.toContain("Demais faturas");
  });

  it("texto de coluna vizinha colado depois do valor ('... 162,00 Demais faturas R$ X,XX') não vira parte do valor nem crédito falso", () => {
    const [t] = parseCasasBahiaFatura(pages).filter((t) => t.description.includes("COMPRA"));
    expect(t.amount.toNumber()).toBe(-162);
  });
});

describe("parseCasasBahiaFatura — virada de ano (fechamento em dezembro, vencimento em janeiro)", () => {
  const pages = [
    ["Total da fatura Vencimento Limite de compras Limite de saque", "R$ 50,00 10/01/2027 R$ 5.000,00 R$ 0,00"].join(
      "\n",
    ),
    [
      "Lançamentos Total parcelado para as próximas faturas",
      "Data Descrição Valor R$",
      "20/12 COMPRA DE NATAL 30,00",
      "02/01 COMPRA DE ANO NOVO 20,00",
      "Limites",
    ].join("\n"),
  ];

  it("transação de dezembro fica no ano anterior ao de janeiro (vencimento)", () => {
    const result = parseCasasBahiaFatura(pages);
    const natal = result.find((t) => t.description === "COMPRA DE NATAL")!;
    const anoNovo = result.find((t) => t.description === "COMPRA DE ANO NOVO")!;
    expect(natal.postedDate.toISOString().slice(0, 10)).toBe("2026-12-20");
    expect(anoNovo.postedDate.toISOString().slice(0, 10)).toBe("2027-01-02");
  });
});

describe("parseCasasBahiaFatura — sem seção 'Lançamentos' (ex.: página só de oferta de parcelamento)", () => {
  it("página sem 'Lançamentos' não gera transações, mesmo com datas DD/MM/AAAA no texto", () => {
    const pages = [
      ["Total da fatura Vencimento", "R$ 162,00 10/05/2026"].join("\n"),
      ["Parcelamento da fatura", "1ª parcela de R$ 62,62", "+ 02X fixas de R$ 62,62"].join("\n"),
    ];
    expect(parseCasasBahiaFatura(pages)).toHaveLength(0);
  });

  it("sem 'Vencimento' em lugar nenhum, devolve lista vazia (não quebra)", () => {
    const pages = [["Lançamentos", "29/07 COMPRA 100,00", "Limites"].join("\n")];
    expect(parseCasasBahiaFatura(pages)).toHaveLength(0);
  });
});
