import { afterEach, afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement, closeActiveEngagement, engagementCoversFeature } from "@/lib/billing/engagement";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

/**
 * Etapa 8 — a camada de método. Este é o teste mais sensível do sistema de
 * direitos: até aqui, toda feature `METODO` devolvia `false` para todo mundo
 * (fail-safe). Agora ela é liberada — e **só** por contrato de consultoria
 * ativo. Um erro aqui vaza método para quem pagou só assinatura, que é
 * exatamente o que §3.1 da Metodologia proíbe.
 */
describe("camada de método (integração — Etapa 8, 2026-08-17)", () => {
  let workspaceId: string;
  let profileId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  afterEach(async () => {
    await prisma.consultingEngagement.deleteMany({ where: { workspaceId } });
  });

  async function criarContrato(data: Partial<Parameters<typeof prisma.consultingEngagement.create>[0]["data"]> = {}) {
    return prisma.consultingEngagement.create({
      data: {
        workspaceId,
        modality: "ACOMPANHAMENTO",
        seatType: "individual",
        startsAt: new Date(Date.now() - 86_400_000),
        createdBy: profileId,
        ...(data as object),
      },
    });
  }

  it("sem contrato, nenhuma feature de método é liberada", async () => {
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
    expect(await hasFeature(workspaceId, "metodo_trilha")).toBe(false);
  });

  it("com contrato ativo, a camada de método abre", async () => {
    await criarContrato();
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(true);
  });

  /**
   * O ponto central de §3.1: dinheiro de assinatura não compra método. O
   * workspace de teste tem LEGACY_INTERNAL, que inclui **todas** as features —
   * e mesmo assim as de método continuam fechadas sem consultor.
   */
  it("assinatura com todas as features não libera método sem consultor", async () => {
    const legacy = await prisma.plan.findUnique({ where: { code: "LEGACY_INTERNAL" } });
    if (legacy) {
      await prisma.subscription.create({
        data: { workspaceId, planId: legacy.id, status: "ACTIVE" },
      });
    }

    try {
      // Feature de PLANO passa pela assinatura...
      expect(await hasFeature(workspaceId, "reserva_inteligente")).toBe(true);
      // ...mas a de MÉTODO não, por mais completa que a assinatura seja.
      expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
    } finally {
      await prisma.subscription.deleteMany({ where: { workspaceId } });
    }
  });

  it("contrato ainda não iniciado não libera", async () => {
    await criarContrato({ startsAt: new Date(Date.now() + 86_400_000) });
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  it("contrato encerrado não libera", async () => {
    await criarContrato({ endsAt: new Date(Date.now() - 3600_000) });
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  it("contrato cancelado não libera, mesmo dentro da vigência", async () => {
    await criarContrato({ status: "CANCELADO" });
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  it("encerrar não apaga — vira histórico", async () => {
    await criarContrato();
    await closeActiveEngagement(workspaceId, "CONCLUIDO");

    expect(await activeEngagement(workspaceId)).toBeNull();
    expect(await prisma.consultingEngagement.count({ where: { workspaceId } })).toBe(1);
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  /**
   * §13.8 — um contrato de PROJETO libera só a fase contratada, não a camada
   * inteira. Ampliar escopo por omissão daria de graça o que não foi vendido.
   */
  describe("contrato de projeto limita ao escopo contratado", () => {
    it("libera a feature da fase contratada", async () => {
      const contrato = await criarContrato({ modality: "PROJETO", projectPhase: 3 });
      expect(engagementCoversFeature(contrato, 3)).toBe(true);
    });

    it("não libera feature de outra fase", async () => {
      const contrato = await criarContrato({ modality: "PROJETO", projectPhase: 3 });
      expect(engagementCoversFeature(contrato, 5)).toBe(false);
    });

    it("não libera feature sem fase definida", async () => {
      const contrato = await criarContrato({ modality: "PROJETO", projectPhase: 3 });
      expect(engagementCoversFeature(contrato, null)).toBe(false);
    });

    it("as demais modalidades liberam a camada inteira", async () => {
      const contrato = await criarContrato({ modality: "ACOMPANHAMENTO" });
      expect(engagementCoversFeature(contrato, null)).toBe(true);
      expect(engagementCoversFeature(contrato, 7)).toBe(true);
    });
  });

  /**
   * A referência solta da Etapa 4 virou FK nesta etapa. Encerrar um contrato
   * não pode apagar as concessões que ele gerou — elas são histórico de acesso.
   */
  it("apagar contrato preserva o PlanGrant, apenas soltando o vínculo", async () => {
    const plano = await prisma.plan.findFirst();
    if (!plano) return;

    const contrato = await criarContrato();
    const grant = await prisma.planGrant.create({
      data: {
        workspaceId,
        planId: plano.id,
        engagementId: contrato.id,
        reason: "[teste] concessão via contrato",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86_400_000),
        createdBy: profileId,
      },
    });

    try {
      await prisma.consultingEngagement.delete({ where: { id: contrato.id } });
      const depois = await prisma.planGrant.findUnique({ where: { id: grant.id } });
      expect(depois).not.toBeNull();
      expect(depois!.engagementId).toBeNull();
    } finally {
      await prisma.planGrant.deleteMany({ where: { id: grant.id } });
    }
  });
});
