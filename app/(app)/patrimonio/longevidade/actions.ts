"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceId } from "@/lib/auth/session";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement } from "@/lib/billing/engagement";
import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/api/errors";
import { Decimal } from "@/lib/finance/types";
import { nextVersion, projectAll, type Assumptions } from "@/lib/method/retirement";

function num(raw: FormDataEntryValue | null, fallback: number): number {
  const v = Number(String(raw ?? "").trim().replace(",", "."));
  return Number.isFinite(v) ? v : fallback;
}

function dec(raw: FormDataEntryValue | null): Decimal {
  const v = String(raw ?? "").trim().replace(",", ".");
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? new Decimal(n) : new Decimal(0);
}

/**
 * Grava os **três** cenários como uma versão nova do PLA.
 *
 * Nunca sobrescreve: `nextVersion` avança mesmo com buraco na sequência. Uma
 * projeção é afirmação datada sobre o futuro — refazer a conta com premissa
 * nova não pode apagar o que foi dito ao cliente antes, senão não há como
 * mostrar o que mudou e por quê.
 */
export async function salvarProjecao(formData: FormData) {
  const workspaceId = await requireWorkspaceId();

  if (!(await hasFeature(workspaceId, "pla_projecao"))) {
    throw new ApiError(403, "O Plano de Longevidade faz parte da consultoria.");
  }
  const engagement = await activeEngagement(workspaceId);
  if (!engagement) throw new ApiError(403, "Nenhum contrato de consultoria ativo.");

  const idadeAtual = num(formData.get("idadeAtual"), 40);
  const idadeAlvo = num(formData.get("idadeAlvo"), 65);
  const idadeFinal = num(formData.get("idadeFinal"), 90);

  const input = {
    idadeAtual,
    idadeAlvo,
    rendaDesejadaMensal: dec(formData.get("rendaDesejadaMensal")),
    capitalAtual: dec(formData.get("capitalAtual")),
    aporteMensalAtual: dec(formData.get("aporteMensalAtual")),
  };

  const base: Omit<Assumptions, "taxaRealAnual"> = {
    idadeFinal,
    rendaJaExistenteMensal: dec(formData.get("rendaJaExistenteMensal")).toFixed(2),
  };

  const taxas = {
    conservador: num(formData.get("taxaConservador"), 2) / 100,
    base: num(formData.get("taxaBase"), 4) / 100,
    otimista: num(formData.get("taxaOtimista"), 6) / 100,
  };

  const resultados = projectAll(input, base, taxas);

  const existentes = await prisma.retirementProjection.findMany({
    where: { engagementId: engagement.id },
    select: { version: true },
  });
  const versao = nextVersion(existentes.map((e) => e.version));

  // Os três numa transação: uma versão do PLA são os três cenários juntos, e
  // meia versão gravada seria pior que nenhuma.
  await prisma.$transaction(
    resultados.map((r) =>
      prisma.retirementProjection.create({
        data: {
          workspaceId,
          engagementId: engagement.id,
          scenario: r.scenario,
          version: versao,
          targetAge: idadeAlvo,
          desiredMonthlyIncome: input.rendaDesejadaMensal.toFixed(2),
          assumptions: {
            ...r.assumptions,
            idadeAtual,
            capitalAtual: input.capitalAtual.toFixed(2),
            aporteMensalAtual: input.aporteMensalAtual.toFixed(2),
            suficienciaPct: r.suficienciaPct,
          } as object,
          requiredCapital: r.requiredCapital.toFixed(2),
          requiredMonthlyContribution: r.requiredMonthlyContribution.toFixed(2),
        },
      }),
    ),
  );

  revalidatePath("/patrimonio/longevidade");
  revalidatePath("/painel/saude-financeira");
}
