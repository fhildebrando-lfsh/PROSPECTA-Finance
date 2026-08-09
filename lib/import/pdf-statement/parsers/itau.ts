import { Decimal } from "../types";
import type { PdfStatementTransaction } from "../types";
import type { FaturaParser } from "./registry";

/**
 * Leitor da fatura de cartão Itaú — conferido contra faturas reais dos
 * produtos "Signature" e "PDA" (Registro Nº 042); os dois compartilham o
 * mesmo `institutionId`/slug "itau" (`seeds/seed_carteiras.csv`) e o mesmo
 * layout de fatura, então um leitor só cobre ambos.
 *
 * Particularidades deste banco, sem equivalente nos outros 3 leitores desta
 * pasta:
 *
 * - **Várias subseções de lançamentos**, uma por portador do cartão
 *   adicional (ex.: titular e cônjuge, cada um com seu "final NNNN") —
 *   cada uma começa com o cabeçalho de coluna "DATA ESTABELECIMENTO VALOR
 *   EM R$" e termina em "Lançamentos no cartão (final NNNN) valor". O
 *   leitor varre TODAS as ocorrências desse par início/fim.
 * - **Seção "Compras parceladas - próximas faturas"**: é só uma prévia das
 *   parcelas futuras (mesmas compras, número de parcela já incrementado
 *   para o mês seguinte) — tem o MESMO cabeçalho de coluna, mas nunca é
 *   fechada por "Lançamentos no cartão", e sim por "Total para próximas
 *   faturas". Importar essa seção duplicaria lançamentos futuros que ainda
 *   nem chegaram à fatura real — por isso o texto da página é cortado ANTES
 *   dessa seção, logo no início da extração.
 * - **Nome do estabelecimento quebra em 2 linhas** (categoria + cidade na
 *   linha de baixo, ex.: "VEÍCULOS .ALPHAVILLE IN") — a linha de
 *   continuação não começa com "DD/MM", então nunca é confundida com uma
 *   nova transação; ela é simplesmente ignorada (mesmo padrão da segunda
 *   linha de explicação do estorno do Nubank).
 * - **Contador de parcela sem separador fixo**: aparece como "NN/NN" logo
 *   antes do valor, às vezes com espaço ("MP *QCONCURSOS 09/12"), às vezes
 *   grudado no nome ("Eduzz *Eduzz06/12") — sem parênteses nem a palavra
 *   "Parcela" (diferente do Nubank/Casas Bahia). O leitor sempre tenta
 *   casar "NN/NN" bem no fim da descrição capturada; não há amostra real
 *   de um nome de estabelecimento que termine coincidentemente nesse
 *   formato sem ser parcela, mas é uma ambiguidade estrutural do próprio
 *   banco, não uma limitação deste leitor.
 * - **Nenhuma amostra real trouxe estorno/pagamento como linha de
 *   "Lançamentos"** (o pagamento da fatura anterior só aparece no resumo da
 *   pág. 1, fora da tabela de lançamentos) — por isso este leitor sempre
 *   trata o valor como despesa. Se uma fatura futura mostrar um crédito na
 *   tabela de lançamentos, ajustar aqui então.
 * - **Ano**: a fatura não repete o ano em cada transação — e, diferente dos
 *   outros 3 bancos, o dia/mês impresso numa compra parcelada é o da
 *   **compra original**, não o do ciclo atual (por isso "MP *QCONCURSOS"
 *   aparece com data de junho numa fatura que vence em janeiro). Mesmo
 *   assim, a mesma regra "mês da transação maior que o mês de vencimento
 *   -> ano anterior ao de vencimento" resolve corretamente todos os casos
 *   observados (nenhuma amostra real tinha parcelamento longo o bastante
 *   pra cruzar mais de uma virada de ano).
 */

const DUE_DATE_REGEX = /Vencimento:\s*(\d{2})\/(\d{2})\/(\d{4})/;

const SECTION_HEADER = "DATA ESTABELECIMENTO VALOR EM R$";
const SECTION_END_MARKER = "Lançamentos no cartão";
const FUTURE_INSTALLMENTS_MARKER = "Compras parceladas";

const TRANSACTION_LINE_REGEX = /^(\d{2})\/(\d{2})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})$/;
const INSTALLMENT_SUFFIX_REGEX = /(\d{2})\/(\d{2})\s*$/;

function parseBrlNumber(raw: string): Decimal {
  return new Decimal(raw.replace(/\./g, "").replace(",", "."));
}

function resolveDueDate(fullText: string): { dueMonth: number; dueYear: number } | null {
  const match = DUE_DATE_REGEX.exec(fullText);
  if (!match) return null;
  return { dueMonth: Number(match[2]), dueYear: Number(match[3]) };
}

/** Devolve o texto de cada subseção de lançamentos (uma por portador),
 * já excluindo a prévia de parcelas futuras. */
function extractLancamentosSections(page: string): string[] {
  const truncated = page.split(FUTURE_INSTALLMENTS_MARKER)[0];
  const sections: string[] = [];
  let searchFrom = 0;

  while (true) {
    const start = truncated.indexOf(SECTION_HEADER, searchFrom);
    if (start === -1) break;
    const contentStart = start + SECTION_HEADER.length;
    const end = truncated.indexOf(SECTION_END_MARKER, contentStart);
    if (end === -1) break;
    sections.push(truncated.slice(contentStart, end));
    searchFrom = end + SECTION_END_MARKER.length;
  }

  return sections;
}

export const parseItauFatura: FaturaParser = (pages) => {
  const fullText = pages.join("\n");
  const due = resolveDueDate(fullText);
  if (!due) return [];

  const transactions: PdfStatementTransaction[] = [];

  for (const page of pages) {
    for (const section of extractLancamentosSections(page)) {
      for (const rawLine of section.split("\n")) {
        const line = rawLine.trim();
        const match = TRANSACTION_LINE_REGEX.exec(line);
        if (!match) continue;

        const [, dayRaw, monthRaw, descriptionRaw, amountRaw] = match;
        const month = Number(monthRaw);
        const day = Number(dayRaw);
        if (month < 1 || month > 12 || day < 1 || day > 31) continue;

        let description = descriptionRaw.trim();
        if (!description) continue;

        let installmentNumber: number | null = null;
        let installmentTotal: number | null = null;
        const installmentMatch = INSTALLMENT_SUFFIX_REGEX.exec(description);
        if (installmentMatch) {
          installmentNumber = Number(installmentMatch[1]);
          installmentTotal = Number(installmentMatch[2]);
          description = description.slice(0, installmentMatch.index).trim();
        }

        const amount = parseBrlNumber(amountRaw);
        const year = month > due.dueMonth ? due.dueYear - 1 : due.dueYear;

        transactions.push({
          postedDate: new Date(Date.UTC(year, month - 1, day)),
          amount: amount.abs().negated(),
          description,
          installmentNumber,
          installmentTotal,
        });
      }
    }
  }

  return transactions;
};
