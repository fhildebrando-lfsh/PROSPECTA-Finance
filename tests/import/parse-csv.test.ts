import { describe, expect, it } from "vitest";
import { parseCsvWithHeaderDetection } from "@/lib/import/parse-csv";

describe("parseCsvWithHeaderDetection (§18.1 passo 1/2)", () => {
  it("trata a primeira linha como cabeçalho no caso comum", () => {
    const csv = "Compra,Vence,Valor\n01/01/2026,01/01/2026,100";
    const { headers, records, skippedRows } = parseCsvWithHeaderDetection(csv);
    expect(headers).toEqual(["Compra", "Vence", "Valor"]);
    expect(records).toEqual([{ Compra: "01/01/2026", Vence: "01/01/2026", Valor: "100" }]);
    expect(skippedRows).toBe(0);
  });

  it("pula uma linha de resumo antes do cabeçalho real — o caso do export do Google Sheets", () => {
    // Reproduz o formato exato do arquivo que quebrou o importador: a aba
    // DADOS exportada do Sheets traz uma linha de resumo (último ID etc.)
    // antes da linha de cabeçalho de verdade.
    const csv = [
      ',,,último ID,5677,último ID grupo,5605,,📈 PAINEL (finanças pessoais),,,,,,,,,',
      "ID,ID Grupo,Compra,Vence,Tipo de Carteira,Tipo,Categoria,Subcategoria,Descrição,Responsáveis,Valor,Recorrência,Situação,Resultado,Organização,VENCE EM,DIAS P/,Observação",
      '430,42,25/10/2021,25/10/2021,Itaú,Despesa,5.Transporte,SEGURO (PROTEÇÃO),SEGURO SUHAI,Felipe (eu),"-R$ 225,40",1,pago,Ok,,,,CONTA',
    ].join("\n");

    const { headers, records, skippedRows } = parseCsvWithHeaderDetection(csv);

    expect(skippedRows).toBe(1);
    expect(headers).toContain("Compra");
    expect(headers).toContain("Vence");
    expect(headers).toContain("Valor");
    expect(records).toHaveLength(1);
    expect(records[0]["Compra"]).toBe("25/10/2021");
    expect(records[0]["Descrição"]).toBe("SEGURO SUHAI");
    expect(records[0]["Valor"]).toBe("-R$ 225,40");
  });

  it("retorna vazio para um arquivo vazio, sem quebrar", () => {
    expect(parseCsvWithHeaderDetection("")).toEqual({ headers: [], records: [], skippedRows: 0 });
  });

  it("tolera linhas com número de colunas diferente do cabeçalho (relax_column_count)", () => {
    const csv = "Compra,Vence,Valor\n01/01/2026,01/01/2026,100,extra\n02/01/2026,02/01/2026";
    const { records } = parseCsvWithHeaderDetection(csv);
    expect(records).toHaveLength(2);
    expect(records[1]["Valor"]).toBe("");
  });
});
