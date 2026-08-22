"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { CHECKLIST_PCP } from "@/lib/method/pcp";
import { emptyContentFor, nextVersion, type DeliverableContent } from "@/lib/method/deliverables/catalog";

/**
 * Salva o checklist sucessório dentro do `Deliverable` de código PCP.
 *
 * Escreve **sempre no rascunho**: um PCP validado é a palavra do consultor numa
 * data, e alterar seu conteúdo apagaria a prova do que foi dito. Se o mais
 * recente já estiver validado, uma versão nova nasce como rascunho — mesma
 * regra da Etapa 9.
 */
export async function salvarChecklistSucessorio(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "pcp_sucessorio"))) {
    throw new ApiError(403, "O Plano de Continuidade Patrimonial faz parte da consultoria.");
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) throw new ApiError(403, "Nenhum contrato de consultoria ativo.");

  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  const podeProduzir =
    (membership?.role === "ADVISOR" && membership.advisorCanWrite) || profile.isPlatformAdmin;
  if (!podeProduzir) {
    throw new ApiError(403, "Só o consultor responsável registra o plano de continuidade.");
  }

  const checklist: Record<string, boolean> = {};
  for (const item of CHECKLIST_PCP) {
    checklist[item.key] = formData.get(`item_${item.key}`) === "on";
  }

  const existentes = await prisma.deliverable.findMany({
    where: { engagementId: engagement.id, code: "PCP" },
    orderBy: { version: "desc" },
  });
  const maisRecente = existentes[0];

  if (maisRecente && maisRecente.status === "RASCUNHO") {
    const atual = maisRecente.content as unknown as DeliverableContent;
    await prisma.deliverable.update({
      where: { id: maisRecente.id },
      data: { content: { ...atual, checklist } as object },
    });
  } else {
    // Sem rascunho aberto — inclusive quando não existe PCP nenhum — nasce uma
    // versão nova. `nextVersion` nunca reaproveita número.
    const base = maisRecente
      ? (maisRecente.content as unknown as DeliverableContent)
      : emptyContentFor("PCP");
    await prisma.deliverable.create({
      data: {
        workspaceId,
        engagementId: engagement.id,
        code: "PCP",
        version: nextVersion(existentes.map((d) => d.version)),
        content: { ...base, checklist } as object,
        createdBy: profile.id,
      },
    });
  }

  revalidatePath("/patrimonio/sucessao");
  revalidatePath("/metodo/entregaveis");
  revalidatePath("/painel/saude-financeira");
}
