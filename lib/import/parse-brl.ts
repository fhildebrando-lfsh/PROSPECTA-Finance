import { Decimal } from "@/lib/finance/types";

/**
 * §18.1 — datas dd/mm/aaaa, sem exigir conversão prévia. Datas são "puras"
 * (sem fuso, §15) — retorna sempre meia-noite UTC do dia informado.
 */
export function parseBrDate(raw: string): Date {
  const match = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) throw new Error(`data inválida: "${raw}" (esperado dd/mm/aaaa)`);

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  const overflowed =
    date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day;
  if (overflowed) throw new Error(`data inválida: "${raw}" (dia não existe nesse mês)`);

  return date;
}

/**
 * §18.1 — `R$`, separador de milhar `.`, decimal com vírgula, negativo com
 * sinal ou entre parênteses. Ex.: "R$ 1.234,56", "-1.234,56", "(1.234,56)".
 */
export function parseBrlAmount(raw: string): Decimal {
  let s = raw.trim();
  if (s === "") throw new Error("valor vazio");

  let negative = false;

  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1).trim();
  }

  s = s.replace(/R\$\s*/gi, "").trim();

  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1).trim();
  } else if (s.startsWith("+")) {
    s = s.slice(1).trim();
  }

  // separador de milhar "." removido, decimal "," vira "."
  s = s.replace(/\./g, "").replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(s)) {
    throw new Error(`valor não numérico: "${raw}"`);
  }

  const value = new Decimal(s);
  return negative ? value.negated() : value;
}
