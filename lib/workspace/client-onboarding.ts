import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { createInvite } from "@/lib/workspace/invite";

/**
 * Fase 2 Etapa 4 (ARQUITETURA-IDENTIDADE-PLANOS.md §12) — admin/consultor cria
 * o registro do cliente ANTES dele existir: workspace novo (ainda sem
 * TITULAR), assinatura no plano escolhido (sempre TRIALING/sem cobrança —
 * billing real é escopo futuro), consultor já ativo como ADVISOR (se
 * indicado), e um convite pendente pro e-mail do cliente. O trigger
 * invite-aware (Etapa 1) cuida do resto: quando o cliente se cadastrar com
 * esse e-mail, entra direto nesse workspace como TITULAR em vez de ganhar um
 * workspace pessoal novo.
 */
export async function createClientPreRegistration(params: {
  clientName: string;
  clientEmail: string;
  planId: string;
  createdBy: string;
  advisorProfileId?: string;
  phone?: string;
}) {
  const clientName = params.clientName.trim();
  const clientEmail = params.clientEmail.trim().toLowerCase();
  if (!clientName) throw new ApiError(400, "Informe o nome do cliente.");
  if (!clientEmail) throw new ApiError(400, "Informe o e-mail do cliente.");

  const plan = await prisma.plan.findUnique({ where: { id: params.planId } });
  if (!plan) throw new ApiError(400, "Plano inválido.");

  const workspace = await prisma.workspace.create({
    data: { name: `${clientName} (cliente)` },
  });

  await prisma.subscription.create({
    data: {
      workspaceId: workspace.id,
      planId: plan.id,
      status: "TRIALING",
      paymentProvider: "NONE",
    },
  });

  if (params.advisorProfileId) {
    await prisma.membership.create({
      data: { workspaceId: workspace.id, profileId: params.advisorProfileId, role: "ADVISOR" },
    });
  }

  const invite = await createInvite(workspace.id, params.createdBy, clientEmail, "TITULAR", params.phone);

  return { workspace, invite };
}

/**
 * Cancela um pré-cadastro que o cliente ainda não completou — apaga o
 * workspace inteiro (cascade cuida do convite, da subscription e da
 * membership do consultor, se houver). Recusa se já existir um TITULAR
 * (cliente já aceitou e está usando de verdade — cancelar aqui seria excluir
 * uma conta ativa, não um pré-cadastro).
 */
export async function cancelClientPreRegistration(workspaceId: string) {
  const hasOwner = await prisma.membership.findFirst({
    where: { workspaceId, role: "TITULAR", status: "ACTIVE" },
  });
  if (hasOwner) {
    throw new ApiError(400, "Esse cliente já completou o cadastro — não é mais um pré-cadastro pra cancelar.");
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
}
