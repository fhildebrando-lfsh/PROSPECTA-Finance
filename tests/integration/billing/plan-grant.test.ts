import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { grantPlan, revokePlanGrant } from "@/lib/billing/plan-grant";
import { hasFeature } from "@/lib/billing/entitlements";
import { ApiError } from "@/lib/api/errors";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("grantPlan / revokePlanGrant (integração — Etapa 4, 2026-08-15)", () => {
  let workspaceId: string;
  let profileId: string;
  let planId: string;
  let featureCode: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());

    featureCode = `teste_feature_${randomUUID().slice(0, 8)}`;
    const feature = await prisma.feature.create({ data: { code: featureCode, name: "[teste]" } });
    const plan = await prisma.plan.create({
      data: { code: `teste_plano_${randomUUID().slice(0, 8)}`, name: "[teste] plano", priceCents: 0, billingInterval: "MONTHLY" },
    });
    await prisma.planFeature.create({ data: { planId: plan.id, featureId: feature.id } });
    planId = plan.id;
  });

  afterAll(async () => {
    await prisma.planGrant.deleteMany({ where: { workspaceId } });
    await prisma.planFeature.deleteMany({ where: { planId } });
    await prisma.plan.delete({ where: { id: planId } });
    await prisma.feature.delete({ where: { code: featureCode } });
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("concede acesso à feature do plano, sem tocar em nenhuma Subscription", async () => {
    expect(await hasFeature(workspaceId, featureCode)).toBe(false);

    const grant = await grantPlan({
      workspaceId,
      planId,
      reason: "[teste] cortesia",
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: profileId,
    });

    expect(await hasFeature(workspaceId, featureCode)).toBe(true);

    const subscriptionCount = await prisma.subscription.count({ where: { workspaceId } });
    expect(subscriptionCount).toBe(0); // garantia central do §4.6 — nunca escreve Subscription

    await revokePlanGrant(grant.id);
  });

  it("rejeita data de término no passado", async () => {
    await expect(
      grantPlan({
        workspaceId,
        planId,
        reason: "[teste]",
        endsAt: new Date(Date.UTC(2020, 0, 1)),
        createdBy: profileId,
      }),
    ).rejects.toThrow(ApiError);
  });

  it("revogar remove o acesso mesmo antes do fim natural", async () => {
    const grant = await grantPlan({
      workspaceId,
      planId,
      reason: "[teste]",
      endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: profileId,
    });
    expect(await hasFeature(workspaceId, featureCode)).toBe(true);

    await revokePlanGrant(grant.id);
    expect(await hasFeature(workspaceId, featureCode)).toBe(false);

    const revoked = await prisma.planGrant.findUnique({ where: { id: grant.id } });
    expect(revoked?.revokedAt).not.toBeNull();
  });

  it("concessão expirada (endsAt no passado, criada direto no banco) não libera mais", async () => {
    const grant = await prisma.planGrant.create({
      data: {
        workspaceId,
        planId,
        reason: "[teste] já expirada",
        startsAt: new Date(Date.UTC(2020, 0, 1)),
        endsAt: new Date(Date.UTC(2020, 0, 2)),
        createdBy: profileId,
      },
    });

    expect(await hasFeature(workspaceId, featureCode)).toBe(false);
    await prisma.planGrant.delete({ where: { id: grant.id } });
  });
});
