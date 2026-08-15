"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { rethrowFriendly } from "@/lib/api/prisma-errors";
import { createAdminClient } from "@/lib/supabase/admin";

const IMAGE_BUCKET = "credit-card-images";
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

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

/** Usa a instituição selecionada, ou cria uma nova pelo nome digitado — hoje não existe
 * tela de gerenciar instituições (só seed), então este é o único jeito de cadastrar um
 * banco que ainda não está na lista. */
async function resolveInstitutionId(institutionId: string, newInstitutionName: string): Promise<string | null> {
  const trimmedNew = newInstitutionName.trim();
  if (trimmedNew) {
    const slug = slugify(trimmedNew);
    const institution = await prisma.institution.upsert({
      where: { slug },
      create: { name: trimmedNew, slug },
      update: {},
    });
    return institution.id;
  }
  return institutionId || null;
}

/** Sobe a imagem pro Storage (bucket público, criado fora do app) — nunca bloqueia o
 * cadastro do cartão se a imagem falhar ou não vier. Sobrescreve a imagem anterior
 * (mesmo caminho por walletId). */
async function uploadCardImageIfPresent(
  walletId: string,
  workspaceId: string,
  image: FormDataEntryValue | null,
): Promise<string | undefined> {
  if (!(image instanceof File) || image.size === 0) return undefined;
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    throw new Error("A imagem precisa ser PNG, JPEG ou WebP.");
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new Error("Imagem muito grande — o limite é 2MB.");
  }

  const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const path = `${workspaceId}/${walletId}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(IMAGE_BUCKET)
    .upload(path, image, { upsert: true, contentType: image.type });
  if (error) throw new Error(`Falha ao enviar a imagem: ${error.message}`);

  const { data } = admin.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function removeCardImage(workspaceId: string, imageUrl: string | null) {
  if (!imageUrl) return;
  const path = imageUrl.split(`${IMAGE_BUCKET}/`)[1];
  if (!path) return;
  const admin = createAdminClient();
  await admin.storage.from(IMAGE_BUCKET).remove([path]).catch(() => {});
}

function readCardFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const closingDay = Number(formData.get("closingDay") ?? "");
  const dueDay = Number(formData.get("dueDay") ?? "");
  const creditLimit = formData.get("creditLimit") ? String(formData.get("creditLimit")) : null;
  const annualFee = formData.get("annualFee") ? String(formData.get("annualFee")) : null;
  const annualFeeWaiverNote = String(formData.get("annualFeeWaiverNote") ?? "").trim() || null;
  const rewardsProgramName = String(formData.get("rewardsProgramName") ?? "").trim() || null;
  const pointsPerRealSpent = formData.get("pointsPerRealSpent") ? String(formData.get("pointsPerRealSpent")) : null;
  const pointValueEstimateBRL = formData.get("pointValueEstimateBRL")
    ? String(formData.get("pointValueEstimateBRL"))
    : null;

  if (!name || !closingDay || !dueDay || closingDay < 1 || closingDay > 28 || dueDay < 1 || dueDay > 28) {
    throw new Error("Nome, dia de fechamento e dia de vencimento (de 1 a 28) são obrigatórios.");
  }

  return {
    name,
    closingDay,
    dueDay,
    creditLimit,
    annualFee,
    annualFeeWaiverNote,
    rewardsProgramName,
    pointsPerRealSpent,
    pointValueEstimateBRL,
  };
}

/** Cria a Wallet (kindCode=CARTAO_CREDITO) e o CreditCard junto — "vinculado
 * automaticamente em Carteiras", como pedido. */
export async function createCreditCard(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const fields = readCardFields(formData);
  const institutionId = String(formData.get("institutionId") ?? "");
  const newInstitutionName = String(formData.get("newInstitutionName") ?? "");
  const resolvedInstitutionId = await resolveInstitutionId(institutionId, newInstitutionName);

  let wallet: { id: string };
  try {
    wallet = await prisma.wallet.create({
      data: {
        workspaceId,
        name: fields.name,
        kindCode: "CARTAO_CREDITO",
        institutionId: resolvedInstitutionId,
        closingDay: fields.closingDay,
        dueDay: fields.dueDay,
        creditLimit: fields.creditLimit ?? undefined,
        slug: slugify(fields.name),
      },
    });
  } catch (err) {
    rethrowFriendly(err, `Já existe uma carteira chamada "${fields.name}".`);
  }

  const imageUrl = await uploadCardImageIfPresent(wallet.id, workspaceId, formData.get("image"));

  await prisma.creditCard.create({
    data: {
      walletId: wallet.id,
      imageUrl,
      annualFee: fields.annualFee ?? undefined,
      annualFeeWaiverNote: fields.annualFeeWaiverNote,
      rewardsProgramName: fields.rewardsProgramName,
      pointsPerRealSpent: fields.pointsPerRealSpent ?? undefined,
      pointValueEstimateBRL: fields.pointValueEstimateBRL ?? undefined,
    },
  });

  revalidatePath("/cartoes");
  redirect(`/cartoes/${wallet.id}`);
}

export async function updateCreditCard(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const walletId = String(formData.get("walletId") ?? "");
  if (!walletId) throw new Error("Cartão não identificado.");

  const existing = await prisma.wallet.findFirst({ where: { id: walletId, workspaceId }, include: { creditCard: true } });
  if (!existing) throw new Error("Cartão não encontrado.");

  const fields = readCardFields(formData);
  const institutionId = String(formData.get("institutionId") ?? "");
  const newInstitutionName = String(formData.get("newInstitutionName") ?? "");
  const resolvedInstitutionId = await resolveInstitutionId(institutionId, newInstitutionName);
  const removeImage = formData.get("removeImage") === "true";

  await prisma.wallet.update({
    where: { id: walletId },
    data: {
      name: fields.name,
      institutionId: resolvedInstitutionId,
      closingDay: fields.closingDay,
      dueDay: fields.dueDay,
      creditLimit: fields.creditLimit ?? null,
    },
  });

  let imageUrl = existing.creditCard?.imageUrl ?? null;
  if (removeImage && imageUrl) {
    await removeCardImage(workspaceId, imageUrl);
    imageUrl = null;
  }
  const uploadedUrl = await uploadCardImageIfPresent(walletId, workspaceId, formData.get("image"));
  if (uploadedUrl) imageUrl = uploadedUrl;

  await prisma.creditCard.upsert({
    where: { walletId },
    create: {
      walletId,
      imageUrl,
      annualFee: fields.annualFee ?? undefined,
      annualFeeWaiverNote: fields.annualFeeWaiverNote,
      rewardsProgramName: fields.rewardsProgramName,
      pointsPerRealSpent: fields.pointsPerRealSpent ?? undefined,
      pointValueEstimateBRL: fields.pointValueEstimateBRL ?? undefined,
    },
    update: {
      imageUrl,
      annualFee: fields.annualFee ?? null,
      annualFeeWaiverNote: fields.annualFeeWaiverNote,
      rewardsProgramName: fields.rewardsProgramName,
      pointsPerRealSpent: fields.pointsPerRealSpent ?? null,
      pointValueEstimateBRL: fields.pointValueEstimateBRL ?? null,
    },
  });

  revalidatePath(`/cartoes/${walletId}`);
  revalidatePath("/cartoes");
}

/** §20 — nunca apaga por padrão, só arquiva/desarquiva (mesma regra de Carteiras). */
export async function archiveCreditCard(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const walletId = String(formData.get("walletId") ?? "");
  const isActive = formData.get("isActive") === "true";

  await prisma.wallet.update({ where: { id: walletId, workspaceId }, data: { isActive: !isActive } });
  revalidatePath("/cartoes");
  revalidatePath(`/cartoes/${walletId}`);
}

/** Exclusão de verdade — só permitida se o cartão nunca teve lançamento (mesma regra de
 * Carteiras, FK de Entry.walletId bloqueia via constraint). Apaga a imagem do Storage
 * como melhor esforço, e o CreditCard cascade junto com a Wallet. */
export async function deleteCreditCard(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const walletId = String(formData.get("walletId") ?? "");
  const wallet = await prisma.wallet.findFirst({ where: { id: walletId, workspaceId }, include: { creditCard: true } });
  if (!wallet) throw new Error("Cartão não encontrado.");

  try {
    await prisma.wallet.delete({ where: { id: walletId } });
  } catch {
    throw new Error("Não dá para excluir — esse cartão já tem lançamentos. Arquive em vez de excluir.");
  }

  await removeCardImage(workspaceId, wallet.creditCard?.imageUrl ?? null);

  revalidatePath("/cartoes");
  redirect("/cartoes");
}

/**
 * Edita descrição/categoria/subcategoria de um lançamento da fatura (tela de detalhe do
 * cartão). Quando o lançamento veio de uma importação de PDF (`importedDescription`
 * preenchido), também grava/atualiza a `DescriptionRule` correspondente — da próxima vez
 * que a mesma descrição original do banco aparecer em qualquer fatura importada do
 * workspace, já vem com esta personalização (confirmado com o usuário: vale pra qualquer
 * cartão, só nas PRÓXIMAS importações — nunca reescreve outros lançamentos já existentes).
 */
export async function updateFaturaEntry(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const entryId = String(formData.get("entryId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const subcategoryId = String(formData.get("subcategoryId") ?? "") || null;

  if (!description || !categoryId) {
    throw new Error("Descrição e categoria são obrigatórias.");
  }

  const existing = await prisma.entry.findFirst({ where: { id: entryId, workspaceId } });
  if (!existing) throw new Error("Lançamento não encontrado.");

  await prisma.entry.update({
    where: { id: entryId },
    data: { description, categoryId, subcategoryId, updatedBy: profileId },
  });

  if (existing.importedDescription) {
    const matchDescription = existing.importedDescription.trim().toLowerCase();
    await prisma.descriptionRule.upsert({
      where: { workspaceId_matchDescription: { workspaceId, matchDescription } },
      create: { workspaceId, matchDescription, customDescription: description, categoryId, subcategoryId },
      update: { customDescription: description, categoryId, subcategoryId },
    });
  }

  revalidatePath(`/cartoes/${existing.walletId}`);
}
