import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { assignAdvisor } from "@/lib/workspace/advisor";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

async function createLooseProfile() {
  return prisma.profile.create({ data: { id: randomUUID(), fullName: "[teste] consultor" } });
}

describe("assignAdvisor (integração)", () => {
  let workspaceId: string;
  let profileId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("atribui um consultor novo (cria Membership ADVISOR ativa)", async () => {
    const advisor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, advisor.id);

      const membership = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: advisor.id } },
      });
      expect(membership?.role).toBe("ADVISOR");
      expect(membership?.status).toBe("ACTIVE");
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: advisor.id } });
      await prisma.profile.delete({ where: { id: advisor.id } });
    }
  });

  it("trocar de consultor revoga o anterior e ativa o novo, sem apagar a relação antiga", async () => {
    const firstAdvisor = await createLooseProfile();
    const secondAdvisor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, firstAdvisor.id);
      await assignAdvisor(workspaceId, secondAdvisor.id);

      const [firstMembership, secondMembership] = await Promise.all([
        prisma.membership.findUnique({ where: { workspaceId_profileId: { workspaceId, profileId: firstAdvisor.id } } }),
        prisma.membership.findUnique({ where: { workspaceId_profileId: { workspaceId, profileId: secondAdvisor.id } } }),
      ]);

      expect(firstMembership?.status).toBe("REVOKED");
      expect(firstMembership?.revokedAt).not.toBeNull();
      expect(secondMembership?.status).toBe("ACTIVE");
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: { in: [firstAdvisor.id, secondAdvisor.id] } } });
      await prisma.profile.deleteMany({ where: { id: { in: [firstAdvisor.id, secondAdvisor.id] } } });
    }
  });

  it("advisorProfileId=null só remove o consultor atual, sem atribuir um novo", async () => {
    const advisor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, advisor.id);
      await assignAdvisor(workspaceId, null);

      const membership = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: advisor.id } },
      });
      expect(membership?.status).toBe("REVOKED");

      const activeAdvisors = await prisma.membership.findMany({
        where: { workspaceId, role: "ADVISOR", status: "ACTIVE" },
      });
      expect(activeAdvisors).toHaveLength(0);
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: advisor.id } });
      await prisma.profile.delete({ where: { id: advisor.id } });
    }
  });

  it("reativa um consultor revogado anteriormente (mesmo id, status volta pra ACTIVE)", async () => {
    const advisor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, advisor.id);
      await assignAdvisor(workspaceId, null);
      await assignAdvisor(workspaceId, advisor.id);

      const membership = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: advisor.id } },
      });
      expect(membership?.status).toBe("ACTIVE");
      expect(membership?.revokedAt).toBeNull();
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: advisor.id } });
      await prisma.profile.delete({ where: { id: advisor.id } });
    }
  });
});
