"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { Decimal } from "@/lib/finance/types";
import { validatePolicy } from "@/lib/method/pip";

async function contexto() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new ApiError(403, "Sem acesso a este workspace.");
  assertCanWrite(membership.role, profile.isPlatformAdmin, membership.advisorCanWrite);

  if (!(await hasFeature(workspaceId, "pip_politica"))) {
    throw new ApiError(403, "A Política de Investimento faz parte da consultoria.");
  }
  return { workspaceId, profileId: profile.id };
}

function pct(raw: FormDataEntryValue | null): number | null {
  const v = String(raw ?? "").trim().replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Grava a política inteira de uma vez, e **valida o conjunto antes**.
 *
 * Uma política pode ser aritmeticamente impossível sem que isso apareça ao
 * preencher classe por classe — mínimos somando mais de 100%, por exemplo.
 * Salvar em bloco é o que permite recusar o conjunto incoerente em vez de
 * deixar o cliente descobrir no rebalanceamento.
 */
export async function salvarPolitica(formData: FormData) {
  const { workspaceId, profileId } = await contexto();

  const classes = await prisma.investmentClass.findMany({ orderBy: { sortOrder: "asc" } });

  const bands = classes
    .map((c) => {
      const min = pct(formData.get(`min_${c.code}`));
      const max = pct(formData.get(`max_${c.code}`));
      // Classe deixada em branco simplesmente não entra na política — é
      // diferente de definir 0–0, que proibiria a classe.
      if (min === null && max === null) return null;
      return {
        classCode: c.code,
        classLabel: c.labelPt,
        minPercent: new Decimal(min ?? 0),
        maxPercent: new Decimal(max ?? 100),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  const validacao = validatePolicy(bands);
  if (!validacao.valida) throw new ApiError(400, validacao.erros.join(" "));

  const codigos = bands.map((b) => b.classCode);

  await prisma.$transaction([
    // Classe removida da política some de fato — senão uma faixa antiga
    // continuaria medindo desvio de uma regra que o consultor já abandonou.
    prisma.investmentPolicyTarget.deleteMany({
      where: { workspaceId, ...(codigos.length > 0 ? { classCode: { notIn: codigos } } : {}) },
    }),
    ...bands.map((b) =>
      prisma.investmentPolicyTarget.upsert({
        where: { workspaceId_classCode: { workspaceId, classCode: b.classCode } },
        update: { minPercent: b.minPercent.toFixed(2), maxPercent: b.maxPercent.toFixed(2), setBy: profileId },
        create: {
          workspaceId,
          classCode: b.classCode,
          minPercent: b.minPercent.toFixed(2),
          maxPercent: b.maxPercent.toFixed(2),
          setBy: profileId,
        },
      }),
    ),
  ]);

  revalidatePath("/investimentos/analise");
}
