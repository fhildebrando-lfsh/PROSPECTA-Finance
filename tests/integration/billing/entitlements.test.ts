import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("hasFeature (integração — Etapa 3, 2026-08-15)", () => {
  let workspaceId: string;
  let profileId: string;

  const createdPlanIds: string[] = [];
  const createdFeatureIds: string[] = [];

  async function makeFeature(gateKind: "PLANO" | "METODO" = "PLANO") {
    const code = `teste_feature_${randomUUID().slice(0, 8)}`;
    const feature = await prisma.feature.create({ data: { code, name: `[teste] ${code}`, gateKind } });
    createdFeatureIds.push(feature.id);
    return feature;
  }

  async function makePlanWithFeature(featureId: string) {
    const code = `teste_plano_${randomUUID().slice(0, 8)}`;
    const plan = await prisma.plan.create({
      data: { code, name: `[teste] ${code}`, priceCents: 0, billingInterval: "MONTHLY" },
    });
    createdPlanIds.push(plan.id);
    await prisma.planFeature.create({ data: { planId: plan.id, featureId } });
    return plan;
  }

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
  });

  afterEach(async () => {
    await prisma.subscription.deleteMany({ where: { workspaceId } });
    await prisma.entitlement.deleteMany({ where: { workspaceId } });
  });

  afterAll(async () => {
    await prisma.planFeature.deleteMany({ where: { planId: { in: createdPlanIds } } });
    await prisma.plan.deleteMany({ where: { id: { in: createdPlanIds } } });
    await prisma.feature.deleteMany({ where: { id: { in: createdFeatureIds } } });
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("false para código de feature que não existe no catálogo", async () => {
    expect(await hasFeature(workspaceId, "isso_nao_existe")).toBe(false);
  });

  it("false sem nenhuma Subscription nem Entitlement", async () => {
    const feature = await makeFeature();
    expect(await hasFeature(workspaceId, feature.code)).toBe(false);
  });

  it("true quando a Subscription ativa aponta pra um Plan que inclui a feature", async () => {
    const feature = await makeFeature();
    const plan = await makePlanWithFeature(feature.id);
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "ACTIVE", paymentProvider: "NONE" },
    });

    expect(await hasFeature(workspaceId, feature.code)).toBe(true);
  });

  it("true com Subscription TRIALING (não só ACTIVE)", async () => {
    const feature = await makeFeature();
    const plan = await makePlanWithFeature(feature.id);
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "TRIALING", paymentProvider: "NONE" },
    });

    expect(await hasFeature(workspaceId, feature.code)).toBe(true);
  });

  it("false com Subscription CANCELED", async () => {
    const feature = await makeFeature();
    const plan = await makePlanWithFeature(feature.id);
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "CANCELED", paymentProvider: "NONE" },
    });

    expect(await hasFeature(workspaceId, feature.code)).toBe(false);
  });

  it("false quando a Subscription existe mas o Plan não inclui a feature", async () => {
    const featureIncluida = await makeFeature();
    const featureNaoIncluida = await makeFeature();
    const plan = await makePlanWithFeature(featureIncluida.id);
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "ACTIVE", paymentProvider: "NONE" },
    });

    expect(await hasFeature(workspaceId, featureNaoIncluida.code)).toBe(false);
  });

  it("Entitlement pontual libera mesmo sem Subscription nenhuma", async () => {
    const feature = await makeFeature();
    await prisma.entitlement.create({ data: { workspaceId, featureId: feature.id, reason: "[teste]" } });

    expect(await hasFeature(workspaceId, feature.code)).toBe(true);
  });

  it("Entitlement expirado não libera", async () => {
    const feature = await makeFeature();
    await prisma.entitlement.create({
      data: { workspaceId, featureId: feature.id, reason: "[teste]", expiresAt: new Date(Date.UTC(2020, 0, 1)) },
    });

    expect(await hasFeature(workspaceId, feature.code)).toBe(false);
  });

  it("feature gateKind=METODO retorna sempre false, mesmo com Subscription que a incluiria", async () => {
    const feature = await makeFeature("METODO");
    const plan = await makePlanWithFeature(feature.id);
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "ACTIVE", paymentProvider: "NONE" },
    });

    // ConsultingEngagement ainda não existe (Etapa 8) — fail-safe: nunca libera.
    expect(await hasFeature(workspaceId, feature.code)).toBe(false);
  });
});
