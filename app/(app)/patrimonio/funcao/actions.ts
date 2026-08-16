"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile, assertCanWrite } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { prisma } from "@/lib/db/prisma";
import type { FuncaoPatrimonial } from "@/app/generated/prisma/enums";
import type { PatrimonyItemKind } from "@/lib/method/patrimony-function";
import { FUNCOES } from "@/lib/method/patrimony-function";

async function currentMembership(workspaceId: string) {
  const profile = await requireProfile();
  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  if (!membership) throw new Error("Sem acesso a este workspace.");
  return {
    role: membership.role,
    isPlatformAdmin: profile.isPlatformAdmin,
    advisorCanWrite: membership.advisorCanWrite,
  };
}

/**
 * Etapa 7 do Método (§13.4) — define (ou limpa) a função de uma peça do
 * patrimônio. Um único ponto de escrita para os três tipos, em vez de três
 * ações quase idênticas: o `kind` decide a tabela, e o `where` sempre carrega
 * `workspaceId` (nunca só o id) — mesma proteção de tenant das demais ações.
 */
export async function setPatrimonyFunction(formData: FormData) {
  const workspaceId = await requireWorkspaceId();
  const { role, isPlatformAdmin, advisorCanWrite } = await currentMembership(workspaceId);
  assertCanWrite(role, isPlatformAdmin, advisorCanWrite);
  if (!(await hasFeature(workspaceId, "patrimonio_funcao"))) {
    throw new Error("A classificação funcional do patrimônio está disponível a partir do plano Max.");
  }

  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "") as PatrimonyItemKind;
  const rawFuncao = String(formData.get("funcao") ?? "");
  if (!id) throw new Error("Item não identificado.");

  // "" = limpar a classificação (volta a "sem função"), estado sempre válido.
  if (rawFuncao !== "" && !FUNCOES.includes(rawFuncao as FuncaoPatrimonial)) {
    throw new Error("Função patrimonial inválida.");
  }
  const funcaoPatrimonial = rawFuncao === "" ? null : (rawFuncao as FuncaoPatrimonial);

  switch (kind) {
    case "BEM":
      await prisma.asset.update({ where: { id, workspaceId }, data: { funcaoPatrimonial } });
      break;
    case "INVESTIMENTO":
      await prisma.investment.update({ where: { id, workspaceId }, data: { funcaoPatrimonial } });
      break;
    case "CARTEIRA":
      await prisma.wallet.update({ where: { id, workspaceId }, data: { funcaoPatrimonial } });
      break;
    default:
      throw new Error("Tipo de item inválido.");
  }

  revalidatePath("/patrimonio/funcao");
}
