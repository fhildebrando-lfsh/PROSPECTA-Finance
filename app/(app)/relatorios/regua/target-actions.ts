"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { MACRO_BLOCOS, validateTargets, type TargetInput } from "@/lib/method/allocation-target";

/**
 * Metas da Régua por macrobloco, para um horizonte (§11.4).
 *
 * Salva o horizonte **inteiro** de uma vez, porque a validação é do conjunto:
 * as quatro fatias precisam fechar em 100%, e isso não dá para checar campo a
 * campo. Mesma razão do PIP.
 */
export async function salvarMetasDaRegua(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new ApiError(403, "Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);

  if (!(await hasFeature(workspaceId, "regua_trajetoria"))) {
    throw new ApiError(403, "A trajetória de metas da Régua faz parte da consultoria.");
  }

  const raw = String(formData.get("horizonMonths") ?? "").trim();
  const horizonMonths = raw === "" || raw === "0" ? null : Number(raw);
  if (horizonMonths !== null && (!Number.isInteger(horizonMonths) || horizonMonths < 1)) {
    throw new ApiError(400, "Horizonte inválido.");
  }

  const targets: TargetInput[] = [];
  for (const mb of MACRO_BLOCOS) {
    const v = String(formData.get(`meta_${mb}`) ?? "").trim().replace(",", ".");
    if (v === "") continue;
    const n = Number(v);
    if (!Number.isFinite(n)) throw new ApiError(400, `Valor inválido em ${mb}.`);
    targets.push({ macroBloco: mb, targetPercent: n, horizonMonths });
  }

  const validacao = validateTargets(targets, horizonMonths);
  if (!validacao.valida) throw new ApiError(400, validacao.erros.join(" "));

  const definidos = targets.map((t) => t.macroBloco);

  await prisma.$transaction([
    // Macrobloco apagado do formulário sai da meta — senão continuaria cobrando
    // um alvo que o consultor já removeu.
    prisma.allocationTarget.deleteMany({
      where: { workspaceId, horizonMonths, ...(definidos.length > 0 ? { macroBloco: { notIn: definidos } } : {}) },
    }),
    ...targets.map((t) =>
      prisma.allocationTarget.upsert({
        where: {
          workspaceId_macroBloco_horizonMonths: {
            workspaceId,
            macroBloco: t.macroBloco,
            horizonMonths: horizonMonths as number,
          },
        },
        update: { targetPercent: t.targetPercent.toFixed(2), setBy: profile.id },
        create: {
          workspaceId,
          macroBloco: t.macroBloco,
          horizonMonths,
          targetPercent: t.targetPercent.toFixed(2),
          setBy: profile.id,
        },
      }),
    ),
  ]);

  revalidatePath("/relatorios/regua");
}
