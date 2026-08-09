import { describe, expect, it } from "vitest";
import { parseSantanderFatura } from "@/lib/import/pdf-statement/parsers/santander";

describe("parseSantanderFatura — formato real (conferido contra faturas de 2018-2019, cartão DEZ18)", () => {
  const pages = [
    ["Vencimento", "15/12/2018"].join("\n"),
    [
      "Histórico das Despesas",
      "Data Descrição R$ US$ Data Descrição R$ US$",
      "LUIS S HILDEBRANDO 3410",
      "(+) Despesas/Débitos no Brasil 718,62",
      "Transações Nacionais (+) Despesas/Débitos no Exterior 0,00 0,00",
      "25/04 MERCPAGO PARC 08/12 29,15 (=) Saldo deste cartão 718,62",
      "07/11 PAGAMENTO DE FATURA -202,35",
      "12/11 AME DIG-A 1.108,99 Saldo Anterior 202,35",
      "19/11 CLARO CLIENTE WL 35,00 (-) Total de créditos 0,00",
      "22/11 NETFLIX.COM 27,90",
      "DANIELA HILDEBRANDO 2234",
      "Transações Nacionais",
      "09/11 NIKE SANT 239,80",
      "21/11 PEDRO R. B. PERFI PARC 01/02 160,00",
      "IOF e CET",
    ].join("\n"),
  ];

  it("compra parcelada extrai número/total da parcela mesmo com texto de coluna vizinha colado depois", () => {
    const [t] = parseSantanderFatura(pages).filter((t) => t.description === "MERCPAGO");
    expect(t.installmentNumber).toBe(8);
    expect(t.installmentTotal).toBe(12);
    expect(t.amount.toNumber()).toBe(-29.15);
    expect(t.postedDate.toISOString().slice(0, 10)).toBe("2018-04-25");
  });

  it("'PAGAMENTO DE FATURA' nunca é importado (não é compra nem estorno, é quitação da fatura)", () => {
    const pagamentos = parseSantanderFatura(pages).filter((t) => t.description.includes("PAGAMENTO"));
    expect(pagamentos).toHaveLength(0);
  });

  it("compra sem parcela e sem sinal vira despesa, mesmo com texto de coluna vizinha colado depois", () => {
    const [t] = parseSantanderFatura(pages).filter((t) => t.description === "AME DIG-A");
    expect(t.amount.toNumber()).toBe(-1108.99);
    expect(t.installmentNumber).toBeNull();
  });

  it("compra sem parcela simples (NETFLIX.COM) é lida normalmente", () => {
    const [t] = parseSantanderFatura(pages).filter((t) => t.description === "NETFLIX.COM");
    expect(t.amount.toNumber()).toBe(-27.9);
  });

  it("cabeçalho de portador ('DANIELA HILDEBRANDO 2234') não é confundido com transação", () => {
    const result = parseSantanderFatura(pages);
    expect(result.some((t) => t.description.includes("HILDEBRANDO"))).toBe(false);
  });

  it("segunda subseção (outro portador) também é lida, incluindo parcela", () => {
    const [t] = parseSantanderFatura(pages).filter((t) => t.description.includes("PEDRO"));
    expect(t.installmentNumber).toBe(1);
    expect(t.installmentTotal).toBe(2);
    expect(t.amount.toNumber()).toBe(-160);
  });

  it("transação de abril (mês > mês de vencimento) fica no ano anterior ao do vencimento", () => {
    const [t] = parseSantanderFatura(pages).filter((t) => t.description === "MERCPAGO");
    expect(t.postedDate.getUTCFullYear()).toBe(2018);
  });
});

describe("parseSantanderFatura — sem 'Vencimento' em lugar nenhum", () => {
  it("devolve lista vazia (não quebra)", () => {
    const pages = [["Histórico das Despesas", "08/07 LOJA 11,00", "IOF e CET"].join("\n")];
    expect(parseSantanderFatura(pages)).toHaveLength(0);
  });
});

describe("parseSantanderFatura — sem seção 'Histórico das Despesas'", () => {
  it("página sem a seção não gera transações", () => {
    const pages = [
      ["Vencimento", "15/07/2019"].join("\n"),
      ["Parcelamento de Fatura", "24 X 217,77", "18 X 236,80"].join("\n"),
    ];
    expect(parseSantanderFatura(pages)).toHaveLength(0);
  });
});
