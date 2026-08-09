import { Decimal } from "../types";
import type { PdfStatementTransaction } from "../types";
import type { FaturaParser } from "./registry";

/**
 * Leitor da fatura do Nubank — conferido contra faturas reais de 2019 a
 * 2026 (Registro Nº 041). O formato mudou ao longo dos anos; este leitor
 * mira o formato atual (2026) mas tolera as variações antigas conhecidas:
 *
 * - **2026 (atual):** cada linha de transação tem `DD MES [•••• NNNN]
 *   Descrição [−]R$ valor`. Compras vêm com valor positivo (sem sinal);
 *   estornos e pagamentos vêm com "−R$" (sinal de menos "−", U+2212, não o
 *   hífen comum). O marcador `•••• NNNN` (últimos 4 dígitos do cartão físico)
 *   é opcional — Pix/assinaturas cobradas no crédito não têm.
 * - **2019 (antigo):** sem "R$" no valor de cada linha (só no cabeçalho da
 *   coluna), sem marcador de cartão, e **pagamentos aparecem com valor
 *   positivo** (o sinal negativo/cor verde de hoje não existia — só um
 *   ícone de coração, que não sobrevive à extração de texto). Por isso a
 *   exclusão de "Pagamento em ..." é sempre por texto da descrição, nunca
 *   só pelo sinal do valor.
 *
 * Faturas de mais de um titular (ex.: "Luis Hildebrando" e "Compras de
 * Daniela Hildebrando") aparecem como subseções dentro da mesma tabela —
 * a linha de subtotal ("Nome R$ X,XX") não tem `DD MES` no início, então
 * não é confundida com uma transação.
 */

const MONTHS: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
};

const MONTH_PATTERN = Object.keys(MONTHS).join("|");

/** "DD MES A DD MES" (cabeçalho "TRANSAÇÕES DE ... A ..."), sem ano. */
const PERIOD_REGEX = new RegExp(
  `TRANSA[ÇC][ÕO]ES\\s+DE\\s+(\\d{2})\\s+(${MONTH_PATTERN})\\s+A\\s+(\\d{2})\\s+(${MONTH_PATTERN})`,
  "i",
);

/** "FATURA DD MES AAAA" — aparece no cabeçalho de repetição de cada página, em qualquer era. */
const DUE_DATE_REGEX = new RegExp(`FATURA\\s+(\\d{2})\\s+(${MONTH_PATTERN})\\s+(\\d{4})`, "i");

const TRANSACTION_REGEX = new RegExp(
  `^(\\d{2})\\s+(${MONTH_PATTERN})\\s+(?:[•\\u2022]{3,4}\\s*\\d{4}\\s+)?(.+?)\\s+(-|\\u2212)?\\s*(?:R\\$\\s*)?(\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s*$`,
  "i",
);

const INSTALLMENT_SUFFIX_REGEX = /\s*-\s*Parcela\s+(\d+)\s*\/\s*(\d+)\s*$/i;

function parseBrlNumber(raw: string): Decimal {
  return new Decimal(raw.replace(/\./g, "").replace(",", "."));
}

/** Resolve o ano de cada mês do período — a fatura só imprime dia+mês, nunca o ano
 * junto da transação; o ano vem de "FATURA DD MES AAAA" (vencimento). */
function resolvePeriodYears(fullText: string): { startMonth: number; startYear: number; endMonth: number; endYear: number } | null {
  const periodMatch = PERIOD_REGEX.exec(fullText);
  const dueDateMatch = DUE_DATE_REGEX.exec(fullText);
  if (!periodMatch || !dueDateMatch) return null;

  const startMonth = MONTHS[periodMatch[2].toUpperCase()];
  const endMonth = MONTHS[periodMatch[4].toUpperCase()];
  const dueMonth = MONTHS[dueDateMatch[2].toUpperCase()];
  const dueYear = Number(dueDateMatch[3]);

  // Vencimento normalmente cai no mesmo mês (ou logo depois) do fechamento —
  // se o mês de fechamento for "depois" do mês de vencimento no calendário,
  // o fechamento foi no ano anterior (virada de ano).
  const endYear = endMonth > dueMonth ? dueYear - 1 : dueYear;
  const startYear = startMonth > endMonth ? endYear - 1 : endYear;

  return { startMonth, startYear, endMonth, endYear };
}

export const parseNubankFatura: FaturaParser = (pages) => {
  const fullText = pages.join("\n");
  const years = resolvePeriodYears(fullText);
  if (!years) return [];

  const transactions: PdfStatementTransaction[] = [];

  for (const page of pages) {
    for (const rawLine of page.split("\n")) {
      const line = rawLine.trim();
      const match = TRANSACTION_REGEX.exec(line);
      if (!match) continue;

      const [, dayRaw, monthRaw, descriptionRaw, sign, amountRaw] = match;
      const month = MONTHS[monthRaw.toUpperCase()];
      const day = Number(dayRaw);

      let description = descriptionRaw.trim();
      // "Nome R$ X,XX" (subtotal de titular) e cabeçalhos de coluna não têm
      // descrição de verdade — ignora qualquer linha cuja "descrição" capturada
      // esteja vazia depois do trim (não deveria acontecer, mas por garantia).
      if (!description) continue;

      // Nunca importa a linha de pagamento da fatura em si — não é uma
      // compra, é dinheiro que já saiu da conta do cliente pra quitar o
      // cartão (rastreado à parte, não como lançamento de cartão).
      if (/^Pagamento\s+em\s+/i.test(description)) continue;

      // A segunda linha da explicação de um estorno ("Estorno referente a
      // compra em ..., de valor R$ X, realizada em ...") não começa com
      // "DD MES", então o regex acima nunca a captura como transação —
      // só a linha-resumo ("DD MES Estorno de "X" −R$ valor") entra aqui.
      const isEstorno = /^Estorno\s+de\s+/i.test(description);

      let installmentNumber: number | null = null;
      let installmentTotal: number | null = null;
      const installmentMatch = INSTALLMENT_SUFFIX_REGEX.exec(description);
      if (installmentMatch) {
        installmentNumber = Number(installmentMatch[1]);
        installmentTotal = Number(installmentMatch[2]);
        description = description.slice(0, installmentMatch.index).trim();
      }

      if (isEstorno) {
        description = description.replace(/^Estorno\s+de\s+/i, "Estorno: ").replace(/["“”]/g, "");
      }

      const amount = parseBrlNumber(amountRaw);
      // Compra = positiva na fatura (sem sinal) -> despesa (negativa aqui).
      // Estorno = negativa na fatura ("−R$") -> receita (positiva aqui) —
      // mas no formato antigo (2019) o estorno pode não imprimir sinal
      // nenhum; como não há amostra real desse caso, o sinal impresso
      // continua sendo a fonte da verdade quando presente.
      const isCredit = Boolean(sign) || isEstorno;
      const signedAmount = isCredit ? amount.abs() : amount.abs().negated();

      const year = month === years.endMonth ? years.endYear : years.startYear;

      transactions.push({
        postedDate: new Date(Date.UTC(year, month, day)),
        amount: signedAmount,
        description,
        installmentNumber,
        installmentTotal,
      });
    }
  }

  return transactions;
};
