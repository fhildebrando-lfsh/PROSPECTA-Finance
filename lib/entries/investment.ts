import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { Decimal } from "@/lib/finance/types";
import { generateRecurrenceOccurrences } from "@/lib/finance/installments";
import { parseIsoDate } from "@/lib/validation/entry";

async function requireCategory(nature: "INVESTIMENTO" | "RECEITA", slug: string) {
  const category = await prisma.category.findUnique({ where: { nature_slug: { nature, slug } } });
  if (!category) throw new ApiError(500, `Categoria "${slug}" (${nature}) não encontrada — rode o seed.`);
  return category;
}

async function requireInvestmentWallet(workspaceId: string, walletId: string) {
  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, workspaceId } });
  if (!wallet) throw new ApiError(400, "Carteira inválida.");
  if (wallet.kindCode !== "CONTA_INVESTIMENTO") {
    throw new ApiError(400, 'Investimentos só podem ser cadastrados numa carteira do tipo "Conta Investimento".');
  }
  return wallet;
}

async function requireInvestment(workspaceId: string, investmentId: string) {
  const investment = await prisma.investment.findFirst({ where: { id: investmentId, workspaceId } });
  if (!investment) throw new ApiError(404, "Investimento não encontrado.");
  return investment;
}

export interface CreateInvestmentInput {
  name: string;
  classCode: string;
  walletId: string;
  responsibleId: string;
  acquisitionDate: string;
  /** String decimal positiva (§15 — nunca number/float no transporte). */
  acquisitionAmount: string;
  details: Record<string, unknown>;
  note?: string;
}

/**
 * Cria a posição e o primeiro lançamento ligado a ela (nature=INVESTIMENTO,
 * categoria=Aportes, status=AQUISICAO, na carteira CONTA_INVESTIMENTO
 * escolhida) — numa única transação, mesmo espírito de `createAsset`.
 */
export async function createInvestment(workspaceId: string, profileId: string, input: CreateInvestmentInput) {
  await requireInvestmentWallet(workspaceId, input.walletId);
  const aportes = await requireCategory("INVESTIMENTO", "aportes");
  const date = parseIsoDate(input.acquisitionDate);

  return prisma.$transaction(async (tx) => {
    const investment = await tx.investment.create({
      data: {
        workspaceId,
        walletId: input.walletId,
        classCode: input.classCode,
        name: input.name,
        details: { ...input.details, classCode: input.classCode },
      },
    });

    await tx.entry.create({
      data: {
        workspaceId,
        walletId: input.walletId,
        investmentId: investment.id,
        nature: "INVESTIMENTO",
        categoryId: aportes.id,
        description: input.name,
        responsibleId: input.responsibleId,
        amount: input.acquisitionAmount,
        recurrenceCode: "UNICA",
        statusCode: "AQUISICAO",
        transactionDate: date,
        dueDate: date,
        note: input.note ?? null,
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    return investment;
  });
}

const EVENT_CATEGORY_SLUGS = ["ganho_de_capital", "perdas", "dividendos", "juros", "retiradas", "impostos", "cambio"] as const;
export type InvestmentEventCategorySlug = (typeof EVENT_CATEGORY_SLUGS)[number];

export interface RegisterInvestmentEventInput {
  investmentId: string;
  categorySlug: InvestmentEventCategorySlug;
  date: string;
  /** String decimal, já com sinal (positivo = aumenta a posição, negativo = reduz). */
  amount: string;
  responsibleId: string;
  note?: string;
}

/** Registra um evento da posição (ganho de capital, perda, dividendo, juro, retirada,
 * imposto, câmbio) — novo `Entry`, nature=INVESTIMENTO, status=ATUALIZACAO, na mesma
 * carteira da posição. Nunca edita lançamentos antigos, mesmo espírito de
 * `registerAssetValuation`. */
export async function registerInvestmentEvent(workspaceId: string, profileId: string, input: RegisterInvestmentEventInput) {
  const investment = await requireInvestment(workspaceId, input.investmentId);
  const category = await requireCategory("INVESTIMENTO", input.categorySlug);
  const date = parseIsoDate(input.date);

  return prisma.entry.create({
    data: {
      workspaceId,
      walletId: investment.walletId,
      investmentId: investment.id,
      nature: "INVESTIMENTO",
      categoryId: category.id,
      description: investment.name,
      responsibleId: input.responsibleId,
      amount: input.amount,
      recurrenceCode: "UNICA",
      statusCode: "ATUALIZACAO",
      transactionDate: date,
      dueDate: date,
      note: input.note ?? null,
      createdBy: profileId,
      updatedBy: profileId,
    },
  });
}

const INCOME_CATEGORY_SLUGS = ["aluguel", "participacao_nos_lucros"] as const;
export type InvestmentIncomeCategorySlug = (typeof INCOME_CATEGORY_SLUGS)[number];

export interface RegisterInvestmentIncomeInput {
  investmentId: string;
  /** Carteira DE VERDADE onde o dinheiro realmente caiu — nunca a carteira da posição. */
  walletId: string;
  categorySlug: InvestmentIncomeCategorySlug;
  date: string;
  /** String decimal positiva. */
  amount: string;
  responsibleId: string;
  note?: string;
}

/** Registra renda real recebida (aluguel, distribuição de lucro) — novo `Entry`,
 * nature=RECEITA, numa carteira de verdade escolhida pelo cliente, ligado à posição por
 * `investmentId` mesmo estando em carteira/natureza diferente. */
export async function registerInvestmentIncome(workspaceId: string, profileId: string, input: RegisterInvestmentIncomeInput) {
  const investment = await requireInvestment(workspaceId, input.investmentId);
  const wallet = await prisma.wallet.findFirst({ where: { id: input.walletId, workspaceId } });
  if (!wallet) throw new ApiError(400, "Carteira inválida.");
  const category = await requireCategory("RECEITA", input.categorySlug);
  const date = parseIsoDate(input.date);

  return prisma.entry.create({
    data: {
      workspaceId,
      walletId: wallet.id,
      investmentId: investment.id,
      nature: "RECEITA",
      categoryId: category.id,
      description: investment.name,
      responsibleId: input.responsibleId,
      amount: input.amount,
      recurrenceCode: "UNICA",
      statusCode: "RECEBIDO",
      transactionDate: date,
      dueDate: date,
      note: input.note ?? null,
      createdBy: profileId,
      updatedBy: profileId,
    },
  });
}

export interface GenerateRentIncomeInput {
  investmentId: string;
  walletId: string;
  /** String decimal positiva — valor mensal esperado do aluguel. */
  monthlyAmount: string;
  startDate: string;
  responsibleId: string;
}

/** Gera a série de lançamentos recorrentes mensais de aluguel (24 meses à frente, mesma
 * materialização de qualquer recorrência "Mensal" do lançamento rápido) — só chama
 * `generateRecurrenceOccurrences`, já testada e em produção; nenhuma lógica de
 * recorrência nova. */
export async function generateRentIncome(workspaceId: string, profileId: string, input: GenerateRentIncomeInput) {
  const investment = await requireInvestment(workspaceId, input.investmentId);
  const wallet = await prisma.wallet.findFirst({ where: { id: input.walletId, workspaceId } });
  if (!wallet) throw new ApiError(400, "Carteira inválida.");
  const category = await requireCategory("RECEITA", "aluguel");
  const recurrenceKind = await prisma.recurrenceKind.findUniqueOrThrow({ where: { code: "MENSAL" } });

  const firstDueDate = parseIsoDate(input.startDate);

  return prisma.$transaction(async (tx) => {
    const group = await tx.entryGroup.create({ data: { workspaceId } });
    const occurrences = generateRecurrenceOccurrences({
      firstDueDate,
      transactionDate: firstDueDate,
      amount: new Decimal(input.monthlyAmount),
      groupId: group.id,
      intervalMonths: recurrenceKind.intervalMonths,
    });

    return Promise.all(
      occurrences.map((occ) =>
        tx.entry.create({
          data: {
            workspaceId,
            walletId: wallet.id,
            investmentId: investment.id,
            groupId: occ.groupId,
            nature: "RECEITA",
            categoryId: category.id,
            description: investment.name,
            responsibleId: input.responsibleId,
            amount: occ.amount,
            recurrenceCode: "MENSAL",
            statusCode: "A_RECEBER",
            transactionDate: occ.transactionDate,
            dueDate: occ.dueDate,
            createdBy: profileId,
            updatedBy: profileId,
          },
        }),
      ),
    );
  });
}

export interface UpdateInvestmentEventEntryInput {
  entryId: string;
  investmentId: string;
  /** Slug de `EVENT_CATEGORY_SLUGS` ou `INCOME_CATEGORY_SLUGS`, conforme a natureza do
   * Entry existente (nunca trocada por este update — ver comentário abaixo). */
  categorySlug: string;
  date: string;
  /** String decimal, já com sinal — igual `RegisterInvestmentEventInput.amount`. */
  amount: string;
  responsibleId: string;
}

/**
 * Edita um lançamento já existente do histórico de um investimento (evento de posição ou
 * renda recebida) — pedido do usuário, 2026-08-11: a tabela "histórico de movimentações"
 * precisa de Editar/Salvar, impactando o `Entry` de verdade. Diferente de
 * `registerInvestmentEvent`/`registerInvestmentIncome` (que só criam), este só existe pra
 * corrigir um lançamento já lançado — mesmo espírito de `updateIncidentEntry`.
 *
 * `nature`/`walletId` nunca mudam aqui (vêm do Entry existente, não do input) — evita
 * "converter" sem querer uma Renda numa Posição, ou mover um evento de posição pra fora
 * da carteira do investimento. `categorySlug` é resolvido pela MESMA natureza do Entry
 * existente (`requireCategory` já rejeita um slug que não existir pra essa natureza).
 */
export async function updateInvestmentEventEntry(
  workspaceId: string,
  profileId: string,
  input: UpdateInvestmentEventEntryInput,
) {
  const existing = await prisma.entry.findFirst({
    where: { id: input.entryId, workspaceId, investmentId: input.investmentId },
  });
  if (!existing) throw new ApiError(404, "Lançamento não encontrado.");

  const nature = existing.nature === "RECEITA" ? "RECEITA" : "INVESTIMENTO";
  const category = await requireCategory(nature, input.categorySlug);
  const date = parseIsoDate(input.date);

  return prisma.entry.update({
    where: { id: input.entryId },
    data: {
      categoryId: category.id,
      responsibleId: input.responsibleId,
      amount: input.amount,
      transactionDate: date,
      dueDate: date,
      updatedBy: profileId,
    },
  });
}

/**
 * Exclui um lançamento do histórico de um investimento (evento de posição ou renda
 * recebida) — pedido do usuário, 2026-08-11: botão "Excluir" nas linhas do histórico,
 * obrigatoriamente removendo o `Entry` de verdade (mesmo espírito de `updateInvestmentEventEntry`,
 * escopo duplo por `workspaceId` + `investmentId`). Não impede excluir o único lançamento
 * de um investimento (ficaria com posição zerada) — mesma decisão de não bloquear edição
 * de valor a zero, o cliente que decide o que faz sentido no histórico dele.
 */
export async function deleteInvestmentEventEntry(workspaceId: string, investmentId: string, entryId: string) {
  const existing = await prisma.entry.findFirst({
    where: { id: entryId, workspaceId, investmentId },
  });
  if (!existing) throw new ApiError(404, "Lançamento não encontrado.");

  await prisma.entry.delete({ where: { id: entryId } });
}

export interface UpdateInvestmentInput {
  id: string;
  name: string;
  classCode: string;
  details: Record<string, unknown>;
}

/** Renomeia/reclassifica a posição — não mexe nas entries já lançadas. */
export async function updateInvestment(workspaceId: string, input: UpdateInvestmentInput) {
  await prisma.investment.update({
    where: { id: input.id, workspaceId },
    data: { name: input.name, classCode: input.classCode, details: { ...input.details, classCode: input.classCode } },
  });
}

/** Arquivar (§20) — caminho normal pra "aposentar" uma posição com histórico
 * (ex.: vendeu tudo, encerrou a aplicação). */
export async function archiveInvestment(workspaceId: string, id: string, isActive: boolean) {
  await prisma.investment.update({ where: { id, workspaceId }, data: { isActive: !isActive } });
}

/** Excluir de verdade só é permitido sem nenhum lançamento vinculado (mesma regra de
 * `Wallet`/`CreditCard`/`Subcategory`) — a FK `Entry.investmentId` não tem cascade de
 * propósito (pode haver renda real numa carteira de verdade ligada à posição). */
export async function deleteInvestment(workspaceId: string, id: string) {
  const investment = await prisma.investment.findFirst({ where: { id, workspaceId } });
  if (!investment) throw new ApiError(404, "Investimento não encontrado.");

  try {
    await prisma.investment.delete({ where: { id } });
  } catch {
    throw new ApiError(409, "Não dá pra excluir — esse investimento já tem lançamentos. Arquive em vez de excluir.");
  }
}
