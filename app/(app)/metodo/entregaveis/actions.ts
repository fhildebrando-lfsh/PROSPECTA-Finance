"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { activeEngagement } from "@/lib/billing/engagement";
import {
  DELIVERABLES,
  DELIVERABLE_CODES,
  checkCompleteness,
  emptyContentFor,
  nextVersion,
  type DeliverableContent,
} from "@/lib/method/deliverables/catalog";
import type { DeliverableCode } from "@/app/generated/prisma/enums";

/**
 * §12.1 — quem produz entregável é o consultor responsável, ou o admin da
 * plataforma. Mesma regra da trilha de fases: um artefato do método é a
 * palavra de um profissional, não um documento que o cliente gera para si.
 */
async function requireConsultor(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new ApiError(403, "Sem acesso a este workspace.");

  const ehConsultorComEscrita = membership.role === "ADVISOR" && membership.advisorCanWrite;
  if (!ehConsultorComEscrita && !profile.isPlatformAdmin) {
    throw new ApiError(403, "Só o consultor responsável (ou o administrador) produz entregáveis do método.");
  }
  return profile;
}

/** Cria a próxima versão de um artefato, já com o esqueleto de seções do catálogo. */
export async function criarEntregavel(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireConsultor(workspaceId);

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) throw new ApiError(400, "Não há contrato de consultoria ativo.");

  const code = String(formData.get("code") ?? "") as DeliverableCode;
  if (!DELIVERABLE_CODES.includes(code)) throw new ApiError(400, "Artefato inválido.");

  const existentes = await prisma.deliverable.findMany({
    where: { engagementId: engagement.id, code },
    select: { version: true },
  });

  await prisma.deliverable.create({
    data: {
      workspaceId,
      engagementId: engagement.id,
      code,
      version: nextVersion(existentes.map((d) => d.version)),
      content: emptyContentFor(code) as object,
      createdBy: profile.id,
    },
  });

  revalidatePath("/metodo/entregaveis");
}

/** Salva o conteúdo de um rascunho. Artefato validado não é reescrito (§12.1). */
export async function salvarConteudo(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  await requireConsultor(workspaceId);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new ApiError(400, "Entregável não identificado.");

  const deliverable = await prisma.deliverable.findFirst({ where: { id, workspaceId } });
  if (!deliverable) throw new ApiError(404, "Entregável não encontrado neste workspace.");
  if (deliverable.status !== "RASCUNHO") {
    throw new ApiError(
      400,
      "Este entregável já foi validado. Crie uma versão nova em vez de reescrever o que já foi entregue.",
    );
  }

  const atual = deliverable.content as unknown as DeliverableContent;
  const sections = atual.sections.map((s, i) => ({
    title: s.title,
    body: String(formData.get(`section-${i}`) ?? "").trim(),
  }));

  await prisma.deliverable.update({ where: { id: deliverable.id }, data: { content: { sections } } });
  revalidatePath("/metodo/entregaveis");
}

/**
 * Valida o artefato. Recusa enquanto houver seção vazia — e diz **quais**,
 * porque "incompleto" sem apontar onde é um aviso inútil.
 */
export async function validarEntregavel(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  await requireConsultor(workspaceId);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new ApiError(400, "Entregável não identificado.");

  const deliverable = await prisma.deliverable.findFirst({ where: { id, workspaceId } });
  if (!deliverable) throw new ApiError(404, "Entregável não encontrado neste workspace.");

  const { missing, isComplete } = checkCompleteness(
    deliverable.code,
    deliverable.content as unknown as DeliverableContent,
  );
  if (!isComplete) {
    throw new ApiError(400, `Faltam seções para validar: ${missing.join(", ")}.`);
  }

  await prisma.deliverable.update({
    where: { id: deliverable.id },
    data: { status: "VALIDADO", validatedAt: new Date() },
  });

  revalidatePath("/metodo/entregaveis");
}

export async function excluirRascunho(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  await requireConsultor(workspaceId);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new ApiError(400, "Entregável não identificado.");

  const deliverable = await prisma.deliverable.findFirst({ where: { id, workspaceId } });
  if (!deliverable) throw new ApiError(404, "Entregável não encontrado.");
  // Só rascunho pode ser apagado: entregável validado é registro do que foi
  // dito ao cliente numa data, e apagar isso destruiria a prova do trabalho.
  if (deliverable.status !== "RASCUNHO") {
    throw new ApiError(400, "Entregável validado não pode ser excluído — ele é o registro do que foi entregue.");
  }

  await prisma.deliverable.delete({ where: { id: deliverable.id } });
  revalidatePath("/metodo/entregaveis");
}
