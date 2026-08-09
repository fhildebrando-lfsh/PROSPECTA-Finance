import { Decimal } from "../types";
import type { PdfStatementTransaction } from "../types";
import type { FaturaParser } from "./registry";

/**
 * Leitor da fatura do cartão Porto Seguro — conferido contra 3 faturas reais
 * de 2025-2026 (Registro Nº 042). Formato mais simples que os outros bancos:
 * cada linha de transação é `DD/MM Estabelecimento [-]valor`, uma por linha,
 * sem "R$" e sem coluna vizinha colando texto (diferente da fatura da Casas
 * Bahia) — por isso o regex é ancorado ao início/fim da linha.
 *
 * - Compra normal: valor sem sinal -> despesa (negativo aqui).
 * - Desconto/estorno: sinal "-" ANTES do valor, grudado nele ("-165,99",
 *   sem espaço) -> receita (positivo aqui).
 * - "PAGAMENTO"/"PAGAMENTO PIX" (quitação da fatura) nunca é importado —
 *   mesmo sinal "-" de um estorno de verdade, mas não é uma compra nem um
 *   crédito de compra, é dinheiro que já saiu da conta do cliente pra
 *   quitar o cartão (mesma regra do Nubank/Casas Bahia para pagamento).
 * - Nenhuma amostra real trouxe compra parcelada com contador "N/M" visível
 *   na linha (diferente do Nubank " - Parcela N/M" e da Casas Bahia
 *   "(N/M)") — por isso este leitor sempre devolve `installmentNumber`/
 *   `installmentTotal` nulos. Se uma fatura futura mostrar parcelamento
 *   visível na linha, ajustar este leitor então; até lá, compras parceladas
 *   deste banco são importadas mês a mês como lançamentos avulsos (sem o
 *   aproveitamento de "gerar a série toda de uma vez").
 * - Ano: a fatura não repete o ano em cada transação. Usa "Esta fatura vence
 *   em DD/MM/AAAA" como referência: mês de transação maior que o mês de
 *   vencimento -> ano anterior ao de vencimento; senão, mesmo ano do
 *   vencimento (mesma regra usada nos outros leitores desta pasta).
 */

const DUE_DATE_REGEX = /vence\s+em[\s\S]{0,20}?(\d{2})\/(\d{2})\/(\d{4})/i;

const SECTION_START = "Data Estabelecimento";
const SECTION_END = "Contestações";

const TRANSACTION_LINE_REGEX = /^(\d{2})\/(\d{2})\s+(.+?)\s+(-)?(\d{1,3}(?:\.\d{3})*,\d{2})$/;

function parseBrlNumber(raw: string): Decimal {
  return new Decimal(raw.replace(/\./g, "").replace(",", "."));
}

function resolveDueDate(fullText: string): { dueMonth: number; dueYear: number } | null {
  const match = DUE_DATE_REGEX.exec(fullText);
  if (!match) return null;
  return { dueMonth: Number(match[2]), dueYear: Number(match[3]) };
}

/** Recorta só o trecho da tabela "Lançamentos: compras e saques". */
function extractLancamentosSection(page: string): string | null {
  const start = page.indexOf(SECTION_START);
  if (start === -1) return null;
  const end = page.indexOf(SECTION_END, start);
  return page.slice(start + SECTION_START.length, end === -1 ? undefined : end);
}

export const parsePortoSeguroFatura: FaturaParser = (pages) => {
  const fullText = pages.join("\n");
  const due = resolveDueDate(fullText);
  if (!due) return [];

  const transactions: PdfStatementTransaction[] = [];

  for (const page of pages) {
    const section = extractLancamentosSection(page);
    if (!section) continue;

    for (const rawLine of section.split("\n")) {
      const line = rawLine.trim();
      const match = TRANSACTION_LINE_REGEX.exec(line);
      if (!match) continue;

      const [, dayRaw, monthRaw, descriptionRaw, sign, amountRaw] = match;
      const month = Number(monthRaw);
      const day = Number(dayRaw);
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;

      const description = descriptionRaw.trim();
      if (!description) continue;

      if (/^PAGAMENTO\b/i.test(description)) continue;

      const amount = parseBrlNumber(amountRaw);
      const isCredit = Boolean(sign);
      const signedAmount = isCredit ? amount.abs() : amount.abs().negated();

      const year = month > due.dueMonth ? due.dueYear - 1 : due.dueYear;

      transactions.push({
        postedDate: new Date(Date.UTC(year, month - 1, day)),
        amount: signedAmount,
        description,
        installmentNumber: null,
        installmentTotal: null,
      });
    }
  }

  return transactions;
};
