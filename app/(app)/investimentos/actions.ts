"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import {
  archiveInvestment,
  createInvestment,
  deleteInvestment,
  deleteInvestmentEventEntry,
  generateRentIncome,
  registerInvestmentEvent,
  registerInvestmentIncome,
  updateInvestment,
  updateInvestmentEventEntry,
  type InvestmentEventCategorySlug,
  type InvestmentIncomeCategorySlug,
} from "@/lib/entries/investment";

async function currentMembership(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  return {
    profileId: profile.id,
    role: membership.role,
    isPlatformAdmin: profile.isPlatformAdmin,
    advisorCanWrite: membership.advisorCanWrite,
  };
}

/** Todo campo possível de `Investment.details`, coberto pelas 13 classes — só os
 * preenchidos entram no JSON gravado (ver `lib/finance/investment.ts::InvestmentDetails`). */
const DETAIL_FIELDS = [
  "instrumentType",
  "ticker",
  "quantidade",
  "precoMedio",
  "indexador",
  "taxa",
  "vencimento",
  "estrategia",
  "cnpjFundo",
  "endereco",
  "aluguelMensalEsperado",
  "placa",
  "kmAtual",
  "quantidadeGramas",
  "unidade",
  "areaHectares",
  "descricaoItem",
  "razaoSocial",
  "percentual",
  "estrategiaFundo",
] as const;

function readDetails(formData: FormData): Record<string, string> {
  const details: Record<string, string> = {};
  for (const field of DETAIL_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    if (value) details[field] = value;
  }
  return details;
}

/** Usa a carteira selecionada, ou cria uma nova (CONTA_INVESTIMENTO) pelo nome digitado
 * — mesmo atalho de "criar instituição nova" em Cartões, pro cliente não precisar sair
 * do formulário pra ter uma corretora/registro novo. */
async function resolveInvestmentWalletId(workspaceId: string, walletId: string, newWalletName: string): Promise<string> {
  const trimmedNew = newWalletName.trim();
  if (trimmedNew) {
    const wallet = await prisma.wallet.create({
      data: { workspaceId, name: trimmedNew, kindCode: "CONTA_INVESTIMENTO", slug: slugify(trimmedNew) },
    });
    return wallet.id;
  }
  if (!walletId) throw new Error("Escolha uma carteira ou digite o nome de uma nova.");
  return walletId;
}

export async function createInvestmentAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const name = String(formData.get("name") ?? "").trim();
  const classCode = String(formData.get("classCode") ?? "");
  const walletIdRaw = String(formData.get("walletId") ?? "");
  const newWalletName = String(formData.get("newWalletName") ?? "");
  const responsibleId = String(formData.get("responsibleId") ?? "");
  const acquisitionDate = String(formData.get("acquisitionDate") ?? "");
  const absAmount = Math.abs(Number(formData.get("acquisitionAmount") ?? "0"));

  if (!name || !classCode || !responsibleId || !acquisitionDate || !absAmount) {
    throw new Error("Preencha nome, classe, responsável, data e valor do aporte inicial.");
  }

  const walletId = await resolveInvestmentWalletId(workspaceId, walletIdRaw, newWalletName);

  const investment = await createInvestment(workspaceId, profileId, {
    name,
    classCode,
    walletId,
    responsibleId,
    acquisitionDate,
    acquisitionAmount: absAmount.toFixed(2),
    details: readDetails(formData),
  });

  revalidatePath("/investimentos");
  redirect(`/investimentos/${investment.id}`);
}

/** Categorias cujo evento sempre reduz a posição — o resto (ganho de capital, dividendo,
 * juro) sempre aumenta; câmbio é o único com sinal livre (toggle no formulário). */
const NEGATIVE_EVENT_SLUGS = new Set(["perdas", "retiradas", "impostos"]);

export async function registerInvestmentEventAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const investmentId = String(formData.get("investmentId") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "") as InvestmentEventCategorySlug;
  const date = String(formData.get("date") ?? "");
  const responsibleId = String(formData.get("responsibleId") ?? "");
  const absAmount = Math.abs(Number(formData.get("amount") ?? "0"));
  const negativeToggle = formData.get("negative") === "true";

  if (!investmentId || !categorySlug || !date || !responsibleId || !absAmount) {
    throw new Error("Preencha categoria, data, valor e responsável.");
  }

  const isNegative = categorySlug === "cambio" ? negativeToggle : NEGATIVE_EVENT_SLUGS.has(categorySlug);
  const signedAmount = isNegative ? -absAmount : absAmount;

  await registerInvestmentEvent(workspaceId, profileId, {
    investmentId,
    categorySlug,
    date,
    amount: signedAmount.toFixed(2),
    responsibleId,
  });

  revalidatePath(`/investimentos/${investmentId}`);
}

export async function registerInvestmentIncomeAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const investmentId = String(formData.get("investmentId") ?? "");
  const walletId = String(formData.get("walletId") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "") as InvestmentIncomeCategorySlug;
  const date = String(formData.get("date") ?? "");
  const responsibleId = String(formData.get("responsibleId") ?? "");
  const absAmount = Math.abs(Number(formData.get("amount") ?? "0"));

  if (!investmentId || !walletId || !categorySlug || !date || !responsibleId || !absAmount) {
    throw new Error("Preencha carteira, categoria, data, valor e responsável.");
  }

  await registerInvestmentIncome(workspaceId, profileId, {
    investmentId,
    walletId,
    categorySlug,
    date,
    amount: absAmount.toFixed(2),
    responsibleId,
  });

  revalidatePath(`/investimentos/${investmentId}`);
}

export async function updateInvestmentEventEntryAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const entryId = String(formData.get("entryId") ?? "");
  const investmentId = String(formData.get("investmentId") ?? "");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const date = String(formData.get("date") ?? "");
  const responsibleId = String(formData.get("responsibleId") ?? "");
  const amount = Number(formData.get("amount") ?? "0");

  if (!entryId || !investmentId || !categorySlug || !date || !responsibleId || !amount) {
    throw new Error("Preencha categoria, data, valor e responsável.");
  }

  await updateInvestmentEventEntry(workspaceId, profileId, {
    entryId,
    investmentId,
    categorySlug,
    date,
    amount: amount.toFixed(2),
    responsibleId,
  });

  revalidatePath(`/investimentos/${investmentId}`);
}

export async function deleteInvestmentEventEntryAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const entryId = String(formData.get("entryId") ?? "");
  const investmentId = String(formData.get("investmentId") ?? "");
  if (!entryId || !investmentId) throw new Error("Lançamento não identificado.");

  await deleteInvestmentEventEntry(workspaceId, investmentId, entryId);

  revalidatePath(`/investimentos/${investmentId}`);
}

export async function generateRentIncomeAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const investmentId = String(formData.get("investmentId") ?? "");
  const walletId = String(formData.get("walletId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const responsibleId = String(formData.get("responsibleId") ?? "");
  const absAmount = Math.abs(Number(formData.get("monthlyAmount") ?? "0"));

  if (!investmentId || !walletId || !startDate || !responsibleId || !absAmount) {
    throw new Error("Preencha carteira, valor mensal, data de início e responsável.");
  }

  await generateRentIncome(workspaceId, profileId, {
    investmentId,
    walletId,
    monthlyAmount: absAmount.toFixed(2),
    startDate,
    responsibleId,
  });

  revalidatePath(`/investimentos/${investmentId}`);
}

export async function updateInvestmentAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const classCode = String(formData.get("classCode") ?? "");

  if (!id || !name || !classCode) throw new Error("Nome e classe são obrigatórios.");

  await updateInvestment(workspaceId, { id, name, classCode, details: readDetails(formData) });
  revalidatePath(`/investimentos/${id}`);
  revalidatePath("/investimentos");
}

export async function archiveInvestmentAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  await archiveInvestment(workspaceId, id, isActive);
  revalidatePath("/investimentos");
  revalidatePath(`/investimentos/${id}`);
}

export async function deleteInvestmentAction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Investimento não identificado.");

  await deleteInvestment(workspaceId, id);

  revalidatePath("/investimentos");
  redirect("/investimentos");
}
