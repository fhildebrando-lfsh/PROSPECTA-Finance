"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireProfile, requireWorkspaceId, assertCanWrite } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { parseIsoDate, updateEntrySchema } from "@/lib/validation/entry";
import { Decimal } from "@/lib/finance/types";
import { clusterInstallmentRows } from "@/lib/import/group-installments";
import { syncEntryToGoogleCalendar } from "@/lib/integrations/google-calendar/sync";
import type { Prisma } from "@/app/generated/prisma/client";

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

async function loadOwnedIncident(id: string, workspaceId: string) {
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry || entry.workspaceId !== workspaceId) throw new Error("Lançamento não encontrado.");
  return entry;
}

/**
 * Reagrupa os incidentes restantes do workspace com a mesma heurística do
 * importador/backfill (`lib/import/group-installments.ts`) — chamado depois de
 * editar uma linha, para fechar o ciclo sozinho quando a correção faz a
 * parcela combinar com um par real (ex.: corrigiu a descrição ou o valor e
 * agora bate com a parcela irmã), sem precisar rodar o backfill manualmente.
 */
async function tryRegroupIncidents(workspaceId: string) {
  const candidates = await prisma.entry.findMany({
    where: { workspaceId, installmentTotal: { gte: 2 }, groupId: null, incidentAcknowledgedAt: null },
  });

  const { safe } = clusterInstallmentRows(
    candidates.map((e) => ({
      id: e.id,
      walletId: e.walletId,
      categoryId: e.categoryId,
      description: e.description,
      installmentNumber: e.installmentNumber,
      installmentTotal: e.installmentTotal,
      amount: e.amount,
    })),
  );

  for (const cluster of safe) {
    if (cluster.length < 2) continue;
    const group = await prisma.entryGroup.create({ data: { workspaceId } });
    await prisma.entry.updateMany({ where: { id: { in: cluster.map((c) => c.id) } }, data: { groupId: group.id } });
  }
}

function revalidateIncidentPaths() {
  revalidatePath("/compromissos/incidentes");
  revalidatePath("/lancamentos");
  revalidatePath("/patrimonio/dividas");
  revalidatePath("/relatorios/parceladas");
}

/** Confirma que a linha está correta como está (§13) — some da lista sem alterar nenhum dado. */
export async function acknowledgeIncident(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  await loadOwnedIncident(id, workspaceId);

  await prisma.entry.update({
    where: { id },
    data: { incidentAcknowledgedAt: new Date(), updatedBy: profileId },
  });
  revalidateIncidentPaths();
}

/** Mesma confirmação de cima, em lote — usada pela seleção por checkbox da lista de
 * Incidentes. Tolerante a falha individual (ex.: linha já confirmada por outra aba). */
export async function acknowledgeIncidentsBulk(ids: string[]) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await loadOwnedIncident(id, workspaceId);
      await prisma.entry.update({
        where: { id },
        data: { incidentAcknowledgedAt: new Date(), updatedBy: profileId },
      });
    }),
  );
  const confirmed = results.filter((r) => r.status === "fulfilled").length;

  revalidateIncidentPaths();
  return { confirmed, total: ids.length };
}

/**
 * Edita a linha completa do incidente — os mesmos campos de um lançamento
 * normal (§17, `updateEntrySchema`), mais `installmentNumber`/`installmentTotal`
 * (que a edição normal de Lançamentos não deixa tocar — aqui é justamente
 * para corrigir esse dado). `installmentTotal` abaixo de 2 (ou vazio) limpa
 * os dois campos: deixa de ser tratado como parcelamento, saindo da lista de
 * incidentes por não satisfazer mais `isInstallmentIncident()`.
 */
export async function updateIncidentEntry(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { profileId, role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);

  const id = String(formData.get("id") ?? "");
  await loadOwnedIncident(id, workspaceId);

  const input = updateEntrySchema.parse({
    walletId: String(formData.get("walletId") ?? "") || undefined,
    categoryId: String(formData.get("categoryId") ?? "") || undefined,
    subcategoryId: String(formData.get("subcategoryId") ?? "") || null,
    responsibleId: String(formData.get("responsibleId") ?? "") || undefined,
    description: String(formData.get("description") ?? "") || undefined,
    amount: String(formData.get("amount") ?? "") || undefined,
    transactionDate: String(formData.get("transactionDate") ?? "") || undefined,
    dueDate: String(formData.get("dueDate") ?? "") || undefined,
    statusCode: String(formData.get("statusCode") ?? "") || undefined,
  });

  const installmentTotalRaw = Number(formData.get("installmentTotal") ?? 0);
  const installmentTotal = installmentTotalRaw >= 2 ? installmentTotalRaw : null;
  const installmentNumber = installmentTotal ? Number(formData.get("installmentNumber") ?? 1) || 1 : null;
  // "Salvar e Confirmar" (vs. só "Salvar") — grava os campos e já marca a linha como
  // revisada, tirando-a da lista de Incidentes. Sem isso, ela continua pendente mesmo
  // com os dados corrigidos, pra dar chance de conferir antes de confirmar de vez.
  const acknowledge = formData.get("acknowledge") === "1";

  const data: Prisma.EntryUpdateInput = { updatedBy: profileId, installmentTotal, installmentNumber };
  if (acknowledge) data.incidentAcknowledgedAt = new Date();
  if (input.walletId !== undefined) data.wallet = { connect: { id: input.walletId } };
  if (input.categoryId !== undefined) data.category = { connect: { id: input.categoryId } };
  if (input.subcategoryId !== undefined) {
    data.subcategory = input.subcategoryId ? { connect: { id: input.subcategoryId } } : { disconnect: true };
  }
  if (input.responsibleId !== undefined) data.responsible = { connect: { id: input.responsibleId } };
  if (input.amount !== undefined) data.amount = new Decimal(input.amount);
  if (input.description !== undefined) data.description = input.description;
  if (input.transactionDate !== undefined) data.transactionDate = parseIsoDate(input.transactionDate);
  if (input.dueDate !== undefined) data.dueDate = parseIsoDate(input.dueDate);
  if (input.statusCode !== undefined) data.status = { connect: { code: input.statusCode } };

  await prisma.entry.update({ where: { id }, data });
  await tryRegroupIncidents(workspaceId);

  after(() => syncEntryToGoogleCalendar(id));
  revalidateIncidentPaths();
}
