"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import type { Rigidez } from "@/app/generated/prisma/enums";

const RIGIDEZ_VALUES: Rigidez[] = ["RIGIDA", "AJUSTAVEL", "DISCRICIONARIA"];

/**
 * Etapa 9-A.3 (PROSPECTA-MCRF §52) — parâmetros da metodologia.
 *
 * `requireAdminProfile()` e não `assertCanWrite()`: decisão do usuário em
 * 2026-08-16 de que estes números são **globais e só o administrador da
 * plataforma altera**. Não são configuração de workspace — dois clientes com o
 * mesmo dado precisam receber a mesma recomendação, e uma metodologia que muda
 * por cliente deixa de ser metodologia.
 */
export async function updateMethodologyParameter(formData: FormData) {
  const admin = await requireAdminProfile();

  const key = String(formData.get("key") ?? "");
  const raw = String(formData.get("value") ?? "").trim();
  if (!key) throw new ApiError(400, "Parâmetro não identificado.");

  const value = Number(raw);
  if (!Number.isFinite(value)) throw new ApiError(400, "Valor inválido.");

  // Percentual fora de 0–100 não tem significado e produziria CCM negativo ou
  // maior que o CEMA — barra aqui, onde o dado entra.
  if (key.endsWith("_pct") && (value < 0 || value > 100)) {
    throw new ApiError(400, "Percentual precisa ficar entre 0 e 100.");
  }

  const existing = await prisma.methodologyParameter.findUnique({ where: { key } });
  if (!existing) throw new ApiError(404, "Parâmetro não encontrado.");

  await prisma.methodologyParameter.update({
    where: { key },
    data: { value: value.toString(), updatedBy: admin.id },
  });

  revalidatePath("/admin/metodologia");
}

/**
 * §11.1–11.3 — rigidez de uma subcategoria. Só subcategoria **global**
 * (`workspaceId: null`): a classificação vale para todo o sistema, e permitir
 * editar a de um workspace criaria metodologia por cliente pela porta dos
 * fundos.
 */
export async function updateSubcategoryRigidez(formData: FormData) {
  await requireAdminProfile();

  const id = String(formData.get("id") ?? "");
  const raw = String(formData.get("rigidez") ?? "");
  if (!id) throw new ApiError(400, "Subcategoria não identificada.");
  if (raw !== "" && !RIGIDEZ_VALUES.includes(raw as Rigidez)) {
    throw new ApiError(400, "Valor de rigidez inválido.");
  }

  const sub = await prisma.subcategory.findFirst({ where: { id, workspaceId: null } });
  if (!sub) throw new ApiError(404, "Subcategoria global não encontrada.");

  await prisma.subcategory.update({
    where: { id: sub.id },
    data: { rigidez: raw === "" ? null : (raw as Rigidez) },
  });

  revalidatePath("/admin/metodologia");
}
