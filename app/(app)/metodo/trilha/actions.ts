"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { activeEngagement } from "@/lib/billing/engagement";
import type { GatePhaseStatus } from "@/app/generated/prisma/enums";

const RESULTADOS: GatePhaseStatus[] = ["AVANCO_PLENO", "AVANCO_CONDICIONAL", "RETORNO_ASSISTIDO"];

/**
 * Etapa 8 — a trilha do método (§7).
 *
 * **Quem pode mexer:** consultor com escrita concedida, ou administrador da
 * plataforma. Nem o titular do workspace avança a própria fase — o ritual de
 * passagem (§7.3) é ato do profissional, e deixar o cliente se auto-aprovar
 * esvaziaria o gate.
 */
async function requireConsultor(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new ApiError(403, "Sem acesso a este workspace.");

  const ehConsultorComEscrita = membership.role === "ADVISOR" && membership.advisorCanWrite;
  if (!ehConsultorComEscrita && !profile.isPlatformAdmin) {
    throw new ApiError(403, "Só o consultor responsável (ou o administrador) registra passagem de fase.");
  }
  return profile;
}

/** §7 — abre a próxima fase do contrato ativo. */
export async function iniciarFase(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireConsultor(workspaceId);

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) throw new ApiError(400, "Não há contrato de consultoria ativo.");

  const phaseNumber = Number(formData.get("phaseNumber"));
  if (!Number.isInteger(phaseNumber) || phaseNumber < 0 || phaseNumber > 9) {
    throw new ApiError(400, "Fase inválida — o método vai de 0 a 8, mais a Fase ∞ (9).");
  }

  const jaExiste = await prisma.methodPhase.findUnique({
    where: { engagementId_phaseNumber: { engagementId: engagement.id, phaseNumber } },
  });
  if (jaExiste) throw new ApiError(400, "Esta fase já foi aberta neste contrato.");

  await prisma.methodPhase.create({
    data: { engagementId: engagement.id, phaseNumber, startedAt: new Date() },
  });

  void profile;
  revalidatePath("/metodo/trilha");
}

/**
 * §7.2/§7.3 — registra o ritual de passagem. O resultado muda o status da fase
 * e, nos casos com ressalva, exige micrometa com prazo (§7.1 Regra 3):
 * avançar com ressalva sem prazo é avançar sem ressalva nenhuma.
 */
export async function registrarGate(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireConsultor(workspaceId);

  const phaseId = String(formData.get("phaseId") ?? "");
  const criterion = String(formData.get("criterion") ?? "").trim();
  const result = String(formData.get("result") ?? "") as GatePhaseStatus;
  const evidence = String(formData.get("evidence") ?? "").trim() || null;
  const rawFollowUp = String(formData.get("followUpDueAt") ?? "").trim();

  if (!phaseId || !criterion) throw new ApiError(400, "Informe o critério avaliado.");
  if (!RESULTADOS.includes(result)) throw new ApiError(400, "Resultado de gate inválido.");

  const exigeMicrometa = result === "AVANCO_CONDICIONAL" || result === "RETORNO_ASSISTIDO";
  if (exigeMicrometa && !rawFollowUp) {
    throw new ApiError(400, "Avanço condicional e retorno assistido exigem um prazo para a micrometa (§7.1).");
  }

  // Nunca confiar no id do formulário: a fase precisa pertencer a um contrato
  // deste workspace.
  const phase = await prisma.methodPhase.findFirst({
    where: { id: phaseId, engagement: { workspaceId } },
  });
  if (!phase) throw new ApiError(404, "Fase não encontrada neste workspace.");

  await prisma.$transaction([
    prisma.gateCheck.create({
      data: {
        phaseId: phase.id,
        criterion,
        result,
        evidence,
        evaluatedBy: profile.id,
        followUpDueAt: rawFollowUp ? new Date(rawFollowUp) : null,
      },
    }),
    // A fase encerra em qualquer resultado — inclusive retorno assistido, que
    // é uma passagem para trás, não a ausência de passagem.
    prisma.methodPhase.update({
      where: { id: phase.id },
      data: { status: result, endedAt: new Date() },
    }),
  ]);

  revalidatePath("/metodo/trilha");
}
