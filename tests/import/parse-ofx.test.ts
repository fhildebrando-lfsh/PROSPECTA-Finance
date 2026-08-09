import { describe, expect, it } from "vitest";
import { parseOfx } from "@/lib/import/parse-ofx";

/** SGML solto (OFX 1.x) real de banco — tags de valor sem fechamento, como na maioria dos exports brasileiros. */
const LOOSE_SGML_SAMPLE = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260705120000[-3:BRT]
<TRNAMT>-45.90
<FITID>202607050001
<MEMO>MERCADO LIVRE
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260710
<TRNAMT>+1500.00
<FITID>202607100002
<NAME>SALARIO
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

/** OFX 2.0 (XML bem-formado, com fechamento de tag) — alguns bancos exportam assim. */
const WELL_FORMED_XML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<OFX>
<BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20260801</DTPOSTED>
<TRNAMT>-120.50</TRNAMT>
<FITID>1</FITID>
<NAME>PADARIA</NAME>
<MEMO>COMPRA CARTAO</MEMO>
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>`;

describe("parseOfx", () => {
  it("extrai transações de SGML solto (tags de valor sem fechamento)", () => {
    const { transactions, skipped } = parseOfx(LOOSE_SGML_SAMPLE);
    expect(skipped).toBe(0);
    expect(transactions).toHaveLength(2);

    expect(transactions[0].description).toBe("MERCADO LIVRE");
    expect(transactions[0].amount.toNumber()).toBe(-45.9);
    expect(transactions[0].postedDate.toISOString().slice(0, 10)).toBe("2026-07-05");
    expect(transactions[0].fitId).toBe("202607050001");

    expect(transactions[1].description).toBe("SALARIO");
    expect(transactions[1].amount.toNumber()).toBe(1500);
    expect(transactions[1].postedDate.toISOString().slice(0, 10)).toBe("2026-07-10");
  });

  it("descarta hora e fuso do DTPOSTED, mantendo só a data pura", () => {
    const { transactions } = parseOfx(LOOSE_SGML_SAMPLE);
    expect(transactions[0].postedDate.getUTCHours()).toBe(0);
  });

  it("também funciona com XML bem-formado (tags fechadas)", () => {
    const { transactions, skipped } = parseOfx(WELL_FORMED_XML_SAMPLE);
    expect(skipped).toBe(0);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].description).toBe("PADARIA - COMPRA CARTAO");
    expect(transactions[0].amount.toNumber()).toBe(-120.5);
  });

  it("descarta bloco sem DTPOSTED ou TRNAMT válidos e conta em skipped", () => {
    const broken = `
      <STMTTRN>
      <TRNTYPE>DEBIT
      <MEMO>SEM DATA NEM VALOR
      </STMTTRN>
      <STMTTRN>
      <DTPOSTED>20260101
      <TRNAMT>-10.00
      <MEMO>ESSA OK
      </STMTTRN>
    `;
    const { transactions, skipped } = parseOfx(broken);
    expect(skipped).toBe(1);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].description).toBe("ESSA OK");
  });

  it("arquivo sem nenhuma transação retorna lista vazia sem erro", () => {
    expect(parseOfx("<OFX></OFX>")).toEqual({ transactions: [], skipped: 0 });
  });
});
