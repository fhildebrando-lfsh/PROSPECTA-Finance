import { Decimal } from "../types";
import type { PdfStatementTransaction } from "../types";
import type { FaturaParser } from "./registry";

/**
 * Leitor da fatura de cartão Santander — conferido contra faturas reais das
 * 3 variantes de cartão ("123", "Free", sem sufixo) de 2018-2019 (Registro
 * Nº 042); as 3 compartilham o mesmo `institutionId`/slug "santander" e o
 * mesmo layout de fatura, então um leitor só cobre todas.
 *
 * A tabela "Histórico das Despesas" é impressa em 2 colunas lado a lado
 * (lançamentos à esquerda, resumo de saldo/despesas à direita) — quando as
 * duas ficam na mesma altura Y, a reconstrução de linha gruda as duas numa
 * linha só (o texto de resumo sempre vem DEPOIS da transação nessa fusão,
 * nunca antes ou no meio). Por isso, como na Casas Bahia, o regex não é
 * ancorado ao fim da linha — a descrição para no primeiro valor monetário
 * que encontrar, ignorando qualquer texto de resumo colado depois. A busca
 * também é restrita ao trecho entre "Histórico das Despesas" e "IOF e CET"
 * (fora disso é oferta de parcelamento/boleto, cheio de "DD/MM" e "NN/NN"
 * falsos).
 *
 * Cada portador do cartão adicional tem sua própria subseção (ex.: titular e
 * cônjuge, cada um "NOME (final NNNN)") — sem cabeçalho de coluna repetido
 * por subseção (diferente do Itaú), então não é preciso tratar cada uma
 * separado: o cabeçalho do portador não começa com "DD/MM", então nunca é
 * confundido com uma transação.
 *
 * - Compra parcelada: "PARC N/M" em algum ponto da linha, entre o
 *   estabelecimento e o valor (nem sempre logo antes do valor — pode vir
 *   colado ao nome do estabelecimento também). Compra não parcelada não tem
 *   esse marcador.
 * - Estorno/desconto: sinal "-" ANTES do valor, grudado nele ("-202,35",
 *   sem espaço) -> receita (positivo aqui).
 * - "PAGAMENTO DE FATURA" nunca é importado — mesmo sinal "-" de um estorno
 *   de verdade, mas não é uma compra nem um crédito de compra, é dinheiro
 *   que já saiu da conta do cliente pra quitar o cartão (mesma regra do
 *   Nubank/Casas Bahia/Porto Seguro para pagamento).
 * - Ano: a fatura não repete o ano em cada transação, só "DD/MM". Usa
 *   "Vencimento" (rótulo e data em linhas separadas na versão impressa
 *   destas faturas) como referência: mês de transação maior que o mês de
 *   vencimento -> ano anterior ao de vencimento; senão, mesmo ano do
 *   vencimento (mesma regra usada nos outros leitores desta pasta).
 */

const DUE_DATE_REGEX = /Vencimento[\s\S]{0,15}?(\d{2})\/(\d{2})\/(\d{4})/;

const SECTION_START = "Histórico das Despesas";
const SECTION_END = "IOF e CET";

const TRANSACTION_LINE_REGEX = /(\d{2})\/(\d{2})\s+(.+?)\s+(-)?(\d{1,3}(?:\.\d{3})*,\d{2})/;
const INSTALLMENT_SUFFIX_REGEX = /\s*PARC\s*(\d{1,2})\/(\d{1,2})\s*$/i;

function parseBrlNumber(raw: string): Decimal {
  return new Decimal(raw.replace(/\./g, "").replace(",", "."));
}

function resolveDueDate(fullText: string): { dueMonth: number; dueYear: number } | null {
  const match = DUE_DATE_REGEX.exec(fullText);
  if (!match) return null;
  return { dueMonth: Number(match[2]), dueYear: Number(match[3]) };
}

/** Recorta só o trecho da tabela "Histórico das Despesas". */
function extractLancamentosSection(page: string): string | null {
  const start = page.indexOf(SECTION_START);
  if (start === -1) return null;
  const end = page.indexOf(SECTION_END, start);
  return page.slice(start + SECTION_START.length, end === -1 ? undefined : end);
}

export const parseSantanderFatura: FaturaParser = (pages) => {
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

      let description = descriptionRaw.trim();
      if (!description) continue;

      if (/^PAGAMENTO\s+DE\s+FATURA\b/i.test(description)) continue;

      let installmentNumber: number | null = null;
      let installmentTotal: number | null = null;
      const installmentMatch = INSTALLMENT_SUFFIX_REGEX.exec(description);
      if (installmentMatch) {
        installmentNumber = Number(installmentMatch[1]);
        installmentTotal = Number(installmentMatch[2]);
        description = description.slice(0, installmentMatch.index).trim();
      }

      const amount = parseBrlNumber(amountRaw);
      const isCredit = Boolean(sign);
      const signedAmount = isCredit ? amount.abs() : amount.abs().negated();

      const year = month > due.dueMonth ? due.dueYear - 1 : due.dueYear;

      transactions.push({
        postedDate: new Date(Date.UTC(year, month - 1, day)),
        amount: signedAmount,
        description,
        installmentNumber,
        installmentTotal,
      });
    }
  }

  return transactions;
};
