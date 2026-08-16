"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { FeatureGateKind } from "@/app/generated/prisma/enums";

/**
 * Etapa 3 do Método (ARQUITETURA-METODO-PROSPECTAR.md §3.1, 2026-08-15) —
 * atribui/desatribui feature↔plano sem precisar de deploy. O seed
 * (`prisma/seed-plans.ts`) só dá o estado inicial; a partir daqui o admin
 * tem posse total da composição de cada plano.
 */
export async function togglePlanFeature(formData: FormData) {
  await requireAdminProfile();

  const planId = String(formData.get("planId") ?? "");
  const featureId = String(formData.get("featureId") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!planId || !featureId) throw new ApiError(400, "Plano e feature são obrigatórios.");

  if (enabled) {
    await prisma.planFeature.upsert({
      where: { planId_featureId: { planId, featureId } },
      create: { planId, featureId },
      update: {},
    });
  } else {
    await prisma.planFeature.deleteMany({ where: { planId, featureId } });
  }

  revalidatePath("/admin/planos");
}

/** Decide se uma feature é liberada por nível de plano ou por camada de método (§3.2 do documento de arquitetura). */
export async function setFeatureGateKind(formData: FormData) {
  await requireAdminProfile();

  const featureId = String(formData.get("featureId") ?? "");
  const gateKind = String(formData.get("gateKind") ?? "") as FeatureGateKind;
  if (!featureId || (gateKind !== "PLANO" && gateKind !== "METODO")) {
    throw new ApiError(400, "Feature e tipo de liberação são obrigatórios.");
  }

  await prisma.feature.update({ where: { id: featureId }, data: { gateKind } });
  revalidatePath("/admin/planos");
}

/** Ativa/desativa um plano (§20 — nunca exclui, só arquiva; um plano inativo continua existindo pra quem já está nele). */
export async function setPlanActive(formData: FormData) {
  await requireAdminProfile();

  const planId = String(formData.get("planId") ?? "");
  const isActive = formData.get("isActive") === "true";
  if (!planId) throw new ApiError(400, "Plano inválido.");

  await prisma.plan.update({ where: { id: planId }, data: { isActive: !isActive } });
  revalidatePath("/admin/planos");
}
