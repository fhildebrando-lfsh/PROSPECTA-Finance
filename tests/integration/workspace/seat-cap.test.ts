import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createInvite, acceptInvite } from "@/lib/workspace/invite";
import { ApiError } from "@/lib/api/errors";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("teto de assento por plano (integração — Etapa 4, 2026-08-15)", () => {
  let workspaceId: string;
  let titularProfileId: string;

  const createdPlanIds: string[] = [];
  const createdFeatureIds: string[] = [];

  async function makePlan(withFamilySeat: boolean) {
    const code = `teste_plano_${randomUUID().slice(0, 8)}`;
    const plan = await prisma.plan.create({
      data: { code, name: `[teste] ${code}`, priceCents: 0, billingInterval: "MONTHLY" },
    });
    createdPlanIds.push(plan.id);

    if (withFamilySeat) {
      let feature = await prisma.feature.findUnique({ where: { code: "multi_seat_5" } });
      if (!feature) {
        feature = await prisma.feature.create({ data: { code: "multi_seat_5", name: "[teste] multi_seat_5" } });
        createdFeatureIds.push(feature.id);
      }
      await prisma.planFeature.create({ data: { planId: plan.id, featureId: feature.id } });
    }
    return plan;
  }

  async function inviteEmail() {
    return `teste+${randomUUID().slice(0, 8)}@example.com`;
  }

  beforeAll(async () => {
    ({ workspaceId, profileId: titularProfileId } = await createTestWorkspace());
  });

  afterEach(async () => {
    await prisma.subscription.deleteMany({ where: { workspaceId } });
    await prisma.planGrant.deleteMany({ where: { workspaceId } });
    await prisma.membership.deleteMany({ where: { workspaceId, profileId: { not: titularProfileId } } });
    await prisma.workspaceInvite.deleteMany({ where: { workspaceId } });
  });

  afterAll(async () => {
    await prisma.planFeature.deleteMany({ where: { planId: { in: createdPlanIds } } });
    await prisma.plan.deleteMany({ where: { id: { in: createdPlanIds } } });
    await prisma.feature.deleteMany({ where: { id: { in: createdFeatureIds } } });
    await cleanupTestWorkspace(workspaceId, titularProfileId);
  });

  it("sem nenhuma Subscription nem PlanGrant, convite não é restringido (comportamento de hoje preservado)", async () => {
    const invite = await createInvite(workspaceId, titularProfileId, await inviteEmail(), "MEMBRO");
    expect(invite.acceptedAt).toBeNull();
  });

  it("plano Individual (sem multi_seat_5): titular já ocupa o único assento, convite é rejeitado", async () => {
    const plan = await makePlan(false);
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "ACTIVE", paymentProvider: "NONE" },
    });

    await expect(createInvite(workspaceId, titularProfileId, await inviteEmail(), "MEMBRO")).rejects.toThrow(
      ApiError,
    );
  });

  it("plano Família (com multi_seat_5): permite convidar até o teto de 5", async () => {
    const plan = await makePlan(true);
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "ACTIVE", paymentProvider: "NONE" },
    });

    // titular já ocupa 1 — mais 4 convites aceitos preenchem o teto de 5.
    const invitedProfiles: string[] = [];
    try {
      for (let i = 0; i < 4; i++) {
        const email = await inviteEmail();
        const invite = await createInvite(workspaceId, titularProfileId, email, "MEMBRO");
        const profile = await prisma.profile.create({ data: { id: randomUUID(), fullName: `[teste] membro ${i}` } });
        invitedProfiles.push(profile.id);
        await acceptInvite(invite.token, profile.id, email);
      }

      // 5º assento já ocupado (titular + 4) — o 6º convite deve ser rejeitado.
      await expect(createInvite(workspaceId, titularProfileId, await inviteEmail(), "MEMBRO")).rejects.toThrow(
        ApiError,
      );
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: { in: invitedProfiles } } });
      await prisma.profile.deleteMany({ where: { id: { in: invitedProfiles } } });
    }
  });

  it("ADVISOR nunca conta como assento — convite passa mesmo com o workspace no teto", async () => {
    const plan = await makePlan(false); // Individual, cap=1, já ocupado só pelo titular
    await prisma.subscription.create({
      data: { workspaceId, planId: plan.id, status: "ACTIVE", paymentProvider: "NONE" },
    });

    const invite = await createInvite(workspaceId, titularProfileId, await inviteEmail(), "ADVISOR");
    expect(invite.role).toBe("ADVISOR");
  });

  it("PlanGrant ativo com multi_seat_5 libera o teto de família, mesmo com Subscription Individual", async () => {
    const individualPlan = await makePlan(false);
    const familyGrantPlan = await makePlan(true);
    await prisma.subscription.create({
      data: { workspaceId, planId: individualPlan.id, status: "ACTIVE", paymentProvider: "NONE" },
    });
    await prisma.planGrant.create({
      data: {
        workspaceId,
        planId: familyGrantPlan.id,
        reason: "[teste] cortesia",
        startsAt: new Date(Date.UTC(2020, 0, 1)),
        endsAt: new Date(Date.UTC(2099, 0, 1)),
        createdBy: titularProfileId,
      },
    });

    // Sem o PlanGrant, o plano Individual (cap=1) já bloquearia — com ele, passa.
    const invite = await createInvite(workspaceId, titularProfileId, await inviteEmail(), "MEMBRO");
    expect(invite.acceptedAt).toBeNull();
  });
});
