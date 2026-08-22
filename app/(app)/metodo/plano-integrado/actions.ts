"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { nextVersion, type DeliverableContent } from "@/lib/method/deliverables/catalog";
import { compilePfi, type DeliverableSnapshot } from "@/lib/method/pfi";

/**
 * Compila e grava uma **versão nova** do PFI (§12.1: "ganha versão nova a cada
 * fase").
 *
 * Nunca sobrescreve, mesmo que a anterior seja rascunho. O PFI é a foto do
 * contrato num momento; regravar por cima apagaria justamente o comparativo
 * que ele existe para permitir.
 */
export async function compilarPfi() {
  const workspaceId = await requireWorkspaceId();
  const profile = await requireProfile();

  if (!(await hasFeature(workspaceId, "pfi_compilador"))) {
    throw new ApiError(403, "O Plano Financeiro Integrado faz parte da consultoria.");
  }

  const engagement = await activeEngagement(workspaceId);
  if (!engagement) throw new ApiError(403, "Nenhum contrato de consultoria ativo.");

  const membership = profile.memberships.find((m) => m.workspaceId === workspaceId);
  const podeProduzir =
    (membership?.role === "ADVISOR" && membership.advisorCanWrite) || profile.isPlatformAdmin;
  if (!podeProduzir) throw new ApiError(403, "Só o consultor responsável compila o plano integrado.");

  const [todos, snapshots] = await Promise.all([
    prisma.deliverable.findMany({
      where: { engagementId: engagement.id },
      orderBy: [{ code: "asc" }, { version: "desc" }],
    }),
    prisma.healthSnapshot.findMany({ where: { workspaceId }, orderBy: { snapshotDate: "asc" } }),
  ]);

  // A versão mais recente de cada código — `orderBy` já trouxe a maior primeiro.
  const maisRecentes = new Map<string, (typeof todos)[number]>();
  for (const d of todos) if (!maisRecentes.has(d.code)) maisRecentes.set(d.code, d);

  const paraSnapshot = (d: (typeof todos)[number]): DeliverableSnapshot => ({
    code: d.code,
    version: d.version,
    status: d.status,
    createdAt: d.createdAt,
    validatedAt: d.validatedAt,
  });

  const pfisAnteriores = todos.filter((d) => d.code === "PFI");
  const pfiAnterior = pfisAnteriores[0] ?? null;

  const { content } = compilePfi({
    deliverables: [...maisRecentes.values()].map(paraSnapshot),
    baseSnapshotDate: snapshots[0]?.snapshotDate ?? null,
    baseIndicators: snapshots[0]?.indicators ?? {},
    atualSnapshotDate: snapshots.at(-1)?.snapshotDate ?? null,
    atualIndicators: snapshots.at(-1)?.indicators ?? {},
    // A versão anterior é reconstituída a partir do que ela própria registrou:
    // guardamos o inventário dentro do content, então comparar não depende de
    // adivinhar o passado.
    pfiAnterior: pfiAnterior
      ? {
          version: pfiAnterior.version,
          deliverables:
            ((pfiAnterior.content as unknown as DeliverableContent & { inventario?: DeliverableSnapshot[] })
              .inventario ?? []),
        }
      : null,
    hoje: new Date(),
  });

  await prisma.deliverable.create({
    data: {
      workspaceId,
      engagementId: engagement.id,
      code: "PFI",
      version: nextVersion(pfisAnteriores.map((d) => d.version)),
      // O inventário fica gravado junto: é o que permite à próxima versão dizer
      // o que mudou sem ter de reconstruir o passado por inferência.
      content: {
        ...content,
        inventario: [...maisRecentes.values()].filter((d) => d.code !== "PFI").map(paraSnapshot),
      } as object,
      createdBy: profile.id,
    },
  });

  revalidatePath("/metodo/plano-integrado");
  revalidatePath("/metodo/entregaveis");
}
