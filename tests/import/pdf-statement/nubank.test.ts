import { describe, expect, it } from "vitest";
import { parseNubankFatura } from "@/lib/import/pdf-statement/parsers/nubank";

describe("parseNubankFatura — formato atual (2026, conferido contra fatura real)", () => {
  const pages = [
    [
      "LUIS FELIPE DA SILVA HILDEBRANDO",
      "FATURA 10 AGO 2026 EMISSÃO E ENVIO 02 AGO 2026",
      "TRANSAÇÕES DE 02 JUL A 02 AGO",
      "Luis Hildebrando R$ 10.337,39",
      "02 JUL •••• 6156 Equipes em Acao - Parcela 6/7 R$ 281,42",
      "02 JUL •••• 6156 Galeriadepaes R$ 64,25",
      "12 JUL Plano NuCel R$ 10,00",
      '11 JUL Estorno de "Mercadolivre*Mercadol" −R$ 199,87',
      "Estorno referente a compra em Mercadolivre*Mercadol, de valor R$ 199,87, realizada em 03 de Julho de 2026",
      "02 JUL Pagamento em 02 JUL −R$ 1.380,30",
      "01 AGO •••• 6156 Chicogrill R$ 63,00",
    ].join("\n"),
  ];

  it("compra normal com marcador de cartão vira despesa, ano do mês de fechamento", () => {
    const [t] = parseNubankFatura(pages).filter((t) => t.description === "Galeriadepaes");
    expect(t.amount.toNumber()).toBe(-64.25);
    expect(t.postedDate.toISOString().slice(0, 10)).toBe("2026-07-02");
    expect(t.installmentNumber).toBeNull();
  });

  it("compra parcelada extrai número/total da parcela e limpa a descrição", () => {
    const [t] = parseNubankFatura(pages).filter((t) => t.description.includes("Equipes"));
    expect(t.description).toBe("Equipes em Acao");
    expect(t.installmentNumber).toBe(6);
    expect(t.installmentTotal).toBe(7);
    expect(t.amount.toNumber()).toBe(-281.42);
  });

  it("cobrança sem marcador de cartão (Pix/assinatura) também é lida", () => {
    const [t] = parseNubankFatura(pages).filter((t) => t.description === "Plano NuCel");
    expect(t.amount.toNumber()).toBe(-10);
  });

  it("estorno vira receita (valor positivo), descrição limpa, sem duplicar a linha de explicação", () => {
    const estornos = parseNubankFatura(pages).filter((t) => t.description.startsWith("Estorno"));
    expect(estornos).toHaveLength(1);
    expect(estornos[0].description).toBe("Estorno: Mercadolivre*Mercadol");
    expect(estornos[0].amount.toNumber()).toBe(199.87);
  });

  it("linha de 'Pagamento em' nunca é importada (não é compra)", () => {
    const pagamentos = parseNubankFatura(pages).filter((t) => t.description.includes("Pagamento"));
    expect(pagamentos).toHaveLength(0);
  });

  it("transação no mês de vencimento (não o de fechamento) usa o ano de vencimento", () => {
    const [t] = parseNubankFatura(pages).filter((t) => t.description === "Chicogrill");
    expect(t.postedDate.toISOString().slice(0, 10)).toBe("2026-08-01");
  });

  it("total de transações extraídas bate (2 compras simples + 1 parcelada + 1 sem cartão + 1 estorno, sem o pagamento)", () => {
    expect(parseNubankFatura(pages)).toHaveLength(5);
  });
});

describe("parseNubankFatura — formato antigo (2019, tolerância a variação)", () => {
  const pages = [
    [
      "TRANSAÇÕES DE 02 JUN A 02 JUL VALORES EM R$",
      "05 JUN Pagamento em 05 JUN 1.018,38",
      "24 JUN Chen e Ling Rp Comerci 246,51",
      "LUIS FELIPE DA SILVA HILDEBRANDO",
      "FATURA 09 JUL 2019 EMISSÃO E ENVIO 02 JUL 2019",
    ].join("\n"),
  ];

  it("lê valor sem 'R$' e sem marcador de cartão (formato de 2019)", () => {
    const result = parseNubankFatura(pages);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Chen e Ling Rp Comerci");
    expect(result[0].amount.toNumber()).toBe(-246.51);
    expect(result[0].postedDate.toISOString().slice(0, 10)).toBe("2019-06-24");
  });

  it("'Pagamento em' continua excluído mesmo sem sinal negativo impresso (formato antigo não usava '−R$')", () => {
    const result = parseNubankFatura(pages);
    expect(result.some((t) => t.description.includes("Pagamento"))).toBe(false);
  });
});

describe("parseNubankFatura — virada de ano (fechamento em dezembro, vencimento em janeiro)", () => {
  const pages = [
    [
      "FATURA 05 JAN 2027 EMISSÃO E ENVIO 28 DEZ 2026",
      "TRANSAÇÕES DE 02 DEZ A 02 JAN",
      "20 DEZ •••• 1111 Compra de Natal R$ 100,00",
      "01 JAN •••• 1111 Compra de Ano Novo R$ 50,00",
    ].join("\n"),
  ];

  it("transação de dezembro fica no ano anterior ao de janeiro", () => {
    const result = parseNubankFatura(pages);
    const natal = result.find((t) => t.description === "Compra de Natal")!;
    const anoNovo = result.find((t) => t.description === "Compra de Ano Novo")!;
    expect(natal.postedDate.toISOString().slice(0, 10)).toBe("2026-12-20");
    expect(anoNovo.postedDate.toISOString().slice(0, 10)).toBe("2027-01-01");
  });
});
