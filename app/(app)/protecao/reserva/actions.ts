"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import { runAssessment } from "@/lib/method/mcrf/run-assessment";

/**
 * §48 — grava a foto do cálculo. **Nunca sobrescreve**: cada avaliação é uma
 * linha nova, com a versão da metodologia que a produziu.
 *
 * Sem `assertCanWrite`: salvar a própria avaliação é ato de leitura sobre o
 * dado do workspace, não edição de dado financeiro. Mesma decisão de
 * `saveHealthSnapshot` (Etapa 5).
 */
export async function saveAssessment() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "reserva_inteligente"))) {
    throw new Error("A Reserva de Emergência inteligente está disponível a partir do plano Max.");
  }

  const a = await runAssessment(workspaceId);

  await prisma.mcrfAssessment.create({
    data: {
      workspaceId,
      methodologyVersion: a.methodologyVersion,
      dataReferenceDate: a.dataReferenceDate,
      cema: a.cema.toFixed(2),
      ccm: a.ccm.toFixed(2),
      reserveTarget: a.reserveTarget.toFixed(2),
      eligibleReserve: a.eligibleReserve.toFixed(2),
      iprf: a.iprf,
      // Só o essencial de cada cenário — o fluxo mês a mês é reconstituível a
      // partir do dado e guardá-lo inflaria a linha sem ganho.
      scenarios: a.scenarios.map((s) => ({
        id: s.id,
        label: s.label,
        need: s.need.toFixed(2),
        isMaterial: s.isMaterial,
        worstMonth: s.worstMonth,
      })),
      mainDrivers: a.mainDrivers,
      dataConfidence: a.dataConfidence,
      createdBy: profile.id,
    },
  });

  revalidatePath("/protecao/reserva");
}
