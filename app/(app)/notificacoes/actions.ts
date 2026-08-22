"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { podeVerInternos } from "@/lib/method/notifications";

/**
 * Marcar um aviso como resolvido.
 *
 * Sem `assertCanWrite` de propósito: dar baixa num aviso é ato de leitura sobre
 * o próprio painel, não edição de dado financeiro — mesma decisão de
 * `saveHealthSnapshot` e `saveAssessment`. Quem tem acesso ao workspace pode
 * limpar a própria caixa.
 *
 * **Nunca apaga.** `resolvedAt` marca a data; o aviso vira histórico. Apagar
 * transformaria a tela numa caixa de entrada sem memória, e o consultor perderia
 * o "isto já foi tratado em tal dia".
 */
async function contexto() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new ApiError(403, "Sem acesso a este workspace.");
  return { workspaceId, membership, profile };
}

export async function resolverNotificacao(formData: FormData) {
  const { workspaceId, membership, profile } = await contexto();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new ApiError(400, "Aviso inválido.");

  // O filtro repete a regra de visibilidade **no servidor**: sem isto, um id
  // de aviso interno colado à mão deixaria o cliente dar baixa em algo que ele
  // nem deveria enxergar. Esconder na tela não é controlar o acesso.
  const podeInternos = podeVerInternos(membership.role, profile.isPlatformAdmin);

  const { count } = await prisma.notification.updateMany({
    where: {
      id,
      workspaceId,
      resolvedAt: null,
      ...(podeInternos ? {} : { visibility: "SHARED" }),
    },
    data: { resolvedAt: new Date() },
  });
  if (count === 0) throw new ApiError(404, "Aviso não encontrado.");

  revalidatePath("/notificacoes");
  revalidatePath("/painel");
}

export async function resolverTodas() {
  const { workspaceId, membership, profile } = await contexto();
  const podeInternos = podeVerInternos(membership.role, profile.isPlatformAdmin);

  await prisma.notification.updateMany({
    where: {
      workspaceId,
      resolvedAt: null,
      ...(podeInternos ? {} : { visibility: "SHARED" }),
    },
    data: { resolvedAt: new Date() },
  });

  revalidatePath("/notificacoes");
  revalidatePath("/painel");
}
