"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId, requireProfile } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { PsfIndicatorResult } from "@/lib/method/psf";

/**
 * Etapa 5 do Método (2026-08-15) — grava uma foto do PSF no momento atual
 * (§8.1: "comparativo início x fim justifica o honorário melhor que
 * qualquer relatório"). Sempre `origin: "AUTO"` — revisão do consultor
 * (`"REVISADO"`) só existe a partir da Etapa 8 (ConsultingEngagement).
 */
export async function saveHealthSnapshot(indicators: {
  organizacao: PsfIndicatorResult;
  endividamento: PsfIndicatorResult;
  liquidez: PsfIndicatorResult;
  protecao: PsfIndicatorResult | null;
  construcao: PsfIndicatorResult | null;
  /**
   * Etapa 16 — os dois últimos indicadores passaram a existir nas Etapas 13 e
   * 15, e a foto continuava gravando só cinco. O PFI compara linha de base ×
   * hoje **a partir destes snapshots**, então a lacuna apagaria justamente a
   * evolução do trabalho de longo prazo. Opcionais porque dependem de gate.
   */
  longevidade?: PsfIndicatorResult | null;
  continuidade?: PsfIndicatorResult | null;
}) {
  const workspaceId = await requireWorkspaceId();
  await requireProfile();

  await prisma.healthSnapshot.create({
    data: {
      workspaceId,
      snapshotDate: new Date(),
      indicators: indicators as object,
      origin: "AUTO",
    },
  });

  revalidatePath("/painel/saude-financeira");
}
