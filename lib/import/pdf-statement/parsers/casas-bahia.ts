import { Decimal } from "../types";
import type { PdfStatementTransaction } from "../types";
import type { FaturaParser } from "./registry";

/**
 * Leitor da fatura do cartão Casas Bahia (emitido pelo Bradescard/Bradesco) —
 * conferido contra 4 faturas reais de 2025-2026 (Registro Nº 042). Cada linha
 * de transação vem como `DD/MM Descrição [(N/M)] valor[ -]` — sem "R$" (só
 * aparece no cabeçalho da coluna e nas caixas de resumo ao lado).
 *
 * A página de lançamentos tem 2 colunas lado a lado ("Lançamentos" à
 * esquerda, "Total parcelado para as próximas faturas" à direita) — quando
 * as duas ficam na mesma altura, a reconstrução de linha por Y gruda o texto
 * das duas colunas numa linha só, em qualquer ordem. Por isso a extração:
 * (1) restringe a busca ao trecho entre "Lançamentos" e "Limites" (fora
 * disso é boleto/código de barras/CPF, cheio de sequências "DD/MM" falsas
 * grudadas em outros números), e (2) usa um regex não ancorado ao início da
 * linha, que localiza a data em qualquer posição e para a descrição no
 * primeiro valor monetário que encontrar — ignorando texto de uma coluna
 * vizinha que tenha ficado colado antes ou depois.
 *
 * - Compra parcelada: sufixo `(N/M)` no fim da descrição (M = total de
 *   parcelas), formato diferente do Nubank ("- Parcela N/M").
 * - "PAGAMENTO RECEBIDO - OBRIGADO" nunca é importado — é dinheiro que já
 *   saiu da conta do cliente pra quitar o cartão, não uma compra nem um
 *   estorno (mesma regra do Nubank para "Pagamento em ..."). Um estorno de
 *   verdade (não há amostra real ainda) usaria o sinal "-" DEPOIS do valor
 *   pra virar receita — a lógica de sinal continua pronta pra esse caso.
 * - Ano: a fatura não repete o ano em cada transação, só "DD/MM". Usa
 *   "Vencimento DD/MM/AAAA" (pág. 1) como referência: mês de transação
 *   maior que o mês de vencimento -> ano anterior ao de vencimento (a
 *   compra foi feita antes da virada do ciclo); senão, mesmo ano do
 *   vencimento.
 */

const DUE_DATE_REGEX = /Vencimento[\s\S]{0,80}?(\d{2})\/(\d{2})\/(\d{4})/;

const TRANSACTION_REGEX = /(\d{2})\/(\d{2})\s+([^\n]+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})(\s*-)?/g;

const INSTALLMENT_SUFFIX_REGEX = /\s*\((\d{1,2})\/(\d{1,2})\)\s*$/;

function parseBrlNumber(raw: string): Decimal {
  return new Decimal(raw.replace(/\./g, "").replace(",", "."));
}

function resolveDueDate(fullText: string): { dueMonth: number; dueYear: number } | null {
  const match = DUE_DATE_REGEX.exec(fullText);
  if (!match) return null;
  return { dueMonth: Number(match[2]), dueYear: Number(match[3]) };
}

/** Recorta só o trecho da tabela de lançamentos, fora do boleto/pág. 1 e das
 * tabelas de encargos financeiros que vêm depois de "Limites". */
function extractLancamentosSection(page: string): string | null {
  const start = page.indexOf("Lançamentos");
  if (start === -1) return null;
  const end = page.indexOf("Limites", start);
  return page.slice(start, end === -1 ? undefined : end);
}

export const parseCasasBahiaFatura: FaturaParser = (pages) => {
  const fullText = pages.join("\n");
  const due = resolveDueDate(fullText);
  if (!due) return [];

  const transactions: PdfStatementTransaction[] = [];

  for (const page of pages) {
    const section = extractLancamentosSection(page);
    if (!section) continue;

    TRANSACTION_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TRANSACTION_REGEX.exec(section))) {
      const [, dayRaw, monthRaw, descriptionRaw, amountRaw, creditMarker] = match;
      const month = Number(monthRaw);
      const day = Number(dayRaw);
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;

      let description = descriptionRaw.trim();
      if (!description) continue;

      // Nunca importa o pagamento da própria fatura — não é uma compra, é
      // dinheiro que já saiu da conta do cliente pra quitar o cartão
      // (rastreado à parte, não como lançamento de cartão).
      if (/^PAGAMENTO\s+RECEBIDO\b/i.test(description)) continue;

      let installmentNumber: number | null = null;
      let installmentTotal: number | null = null;
      const installmentMatch = INSTALLMENT_SUFFIX_REGEX.exec(description);
      if (installmentMatch) {
        installmentNumber = Number(installmentMatch[1]);
        installmentTotal = Number(installmentMatch[2]);
        description = description.slice(0, installmentMatch.index).trim();
      }

      const amount = parseBrlNumber(amountRaw);
      // Pagamento recebido imprime o sinal "-" DEPOIS do valor -> crédito
      // (positivo aqui). Compra não tem sinal nenhum -> despesa (negativo).
      const isCredit = Boolean(creditMarker);
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
