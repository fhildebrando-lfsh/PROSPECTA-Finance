import { Decimal } from "@/lib/finance/types";

export interface OfxTransaction {
  fitId: string | null;
  /** Data "pura" (meia-noite UTC, §15) — hora/fuso do DTPOSTED são descartados. */
  postedDate: Date;
  /** Com sinal, como todo `amount` do sistema (§8.3). */
  amount: Decimal;
  description: string;
}

export interface ParsedOfx {
  transactions: OfxTransaction[];
  /** Blocos `<STMTTRN>` sem DTPOSTED/TRNAMT válidos — descartados, contados aqui. */
  skipped: number;
}

/**
 * §18 — extrator de OFX tolerante a SGML solto (OFX 1.x): bancos brasileiros
 * normalmente exportam tags de valor sem fechamento (`<TRNAMT>-45.90` sem
 * `</TRNAMT>`), então um parser XML estrito quebraria. Em vez disso, extrai
 * cada bloco `<STMTTRN>...</STMTTRN>` (esse par vem fechado mesmo em SGML
 * solto — é uma tag de estrutura, não de valor) e lê os campos de dentro com
 * `<TAG>(valor até o próximo "<" ou quebra de linha)`, funcionando com ou
 * sem fechamento.
 */
export function parseOfx(ofxText: string): ParsedOfx {
  const blocks = [...ofxText.matchAll(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)].map((m) => m[1]);

  const transactions: OfxTransaction[] = [];
  let skipped = 0;

  for (const block of blocks) {
    const transaction = parseTransactionBlock(block);
    if (transaction) transactions.push(transaction);
    else skipped += 1;
  }

  return { transactions, skipped };
}

function extractTag(block: string, tag: string): string | null {
  const match = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(block);
  const value = match?.[1]?.trim();
  return value ? value : null;
}

/** `AAAAMMDD` (com hora/fuso opcionais depois, ex.: `20260705120000[-3:BRT]`, descartados). */
function parseOfxDate(raw: string): Date | null {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length !== 8) return null;

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));

  const overflowed = date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day;
  return overflowed ? null : date;
}

/** TRNAMT vem em decimal com ponto (formato OFX/US), não vírgula (formato §18.1 do CSV). */
function parseOfxAmount(raw: string): Decimal | null {
  const cleaned = raw.trim().replace(",", ".");
  if (!/^[-+]?\d+(\.\d+)?$/.test(cleaned)) return null;
  return new Decimal(cleaned);
}

function parseTransactionBlock(block: string): OfxTransaction | null {
  const dtposted = extractTag(block, "DTPOSTED");
  const trnamt = extractTag(block, "TRNAMT");
  if (!dtposted || !trnamt) return null;

  const postedDate = parseOfxDate(dtposted);
  const amount = parseOfxAmount(trnamt);
  if (!postedDate || !amount) return null;

  const name = extractTag(block, "NAME");
  const memo = extractTag(block, "MEMO");
  const description = [name, memo].filter((v, i, arr) => v && arr.indexOf(v) === i).join(" - ") || "(sem descrição)";

  return { fitId: extractTag(block, "FITID"), postedDate, amount, description };
}
