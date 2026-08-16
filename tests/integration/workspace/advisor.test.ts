import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { assignAdvisor, setAdvisorWriteAccess } from "@/lib/workspace/advisor";
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

describe("setAdvisorWriteAccess (integração — Etapa 0, 2026-08-15)", () => {
  let workspaceId: string;
  let profileId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("consultor novo nasce com advisorCanWrite=false, mesmo sem nenhuma concessão", async () => {
    const advisor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, advisor.id);
      const membership = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: advisor.id } },
      });
      expect(membership?.advisorCanWrite).toBe(false);
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: advisor.id } });
      await prisma.profile.delete({ where: { id: advisor.id } });
    }
  });

  it("concede escrita: advisorCanWrite vira true e gera AccessLog GRANT_ADVISOR_WRITE", async () => {
    const advisor = await createLooseProfile();
    const actor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, advisor.id);
      await setAdvisorWriteAccess({ workspaceId, canWrite: true, actorProfileId: actor.id });

      const membership = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: advisor.id } },
      });
      expect(membership?.advisorCanWrite).toBe(true);

      const log = await prisma.accessLog.findFirst({
        where: { workspaceId, actorProfileId: actor.id, action: "GRANT_ADVISOR_WRITE" },
        orderBy: { occurredAt: "desc" },
      });
      expect(log).not.toBeNull();
    } finally {
      await prisma.accessLog.deleteMany({ where: { actorProfileId: actor.id } });
      await prisma.membership.deleteMany({ where: { profileId: { in: [advisor.id, actor.id] } } });
      await prisma.profile.deleteMany({ where: { id: { in: [advisor.id, actor.id] } } });
    }
  });

  it("revoga escrita: advisorCanWrite volta a false e gera AccessLog REVOKE_ADVISOR_WRITE", async () => {
    const advisor = await createLooseProfile();
    const actor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, advisor.id);
      await setAdvisorWriteAccess({ workspaceId, canWrite: true, actorProfileId: actor.id });
      await setAdvisorWriteAccess({ workspaceId, canWrite: false, actorProfileId: actor.id });

      const membership = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: advisor.id } },
      });
      expect(membership?.advisorCanWrite).toBe(false);

      const log = await prisma.accessLog.findFirst({
        where: { workspaceId, actorProfileId: actor.id, action: "REVOKE_ADVISOR_WRITE" },
        orderBy: { occurredAt: "desc" },
      });
      expect(log).not.toBeNull();
    } finally {
      await prisma.accessLog.deleteMany({ where: { actorProfileId: actor.id } });
      await prisma.membership.deleteMany({ where: { profileId: { in: [advisor.id, actor.id] } } });
      await prisma.profile.deleteMany({ where: { id: { in: [advisor.id, actor.id] } } });
    }
  });

  it("sem consultor ativo, lança erro em vez de conceder escrita a ninguém", async () => {
    const actor = await createLooseProfile();
    try {
      await expect(
        setAdvisorWriteAccess({ workspaceId, canWrite: true, actorProfileId: actor.id }),
      ).rejects.toThrow(/não tem consultor ativo/);
    } finally {
      await prisma.profile.delete({ where: { id: actor.id } });
    }
  });

  it("trocar de consultor nunca herda a concessão de escrita do anterior", async () => {
    const firstAdvisor = await createLooseProfile();
    const secondAdvisor = await createLooseProfile();
    const actor = await createLooseProfile();
    try {
      await assignAdvisor(workspaceId, firstAdvisor.id);
      await setAdvisorWriteAccess({ workspaceId, canWrite: true, actorProfileId: actor.id });

      // mesma pessoa sai e volta — não deve reter a concessão anterior
      await assignAdvisor(workspaceId, null);
      await assignAdvisor(workspaceId, firstAdvisor.id);

      const reactivated = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: firstAdvisor.id } },
      });
      expect(reactivated?.status).toBe("ACTIVE");
      expect(reactivated?.advisorCanWrite).toBe(false);

      // e um segundo consultor completamente novo também nasce sem escrita
      await assignAdvisor(workspaceId, secondAdvisor.id);
      const second = await prisma.membership.findUnique({
        where: { workspaceId_profileId: { workspaceId, profileId: secondAdvisor.id } },
      });
      expect(second?.advisorCanWrite).toBe(false);
    } finally {
      await prisma.accessLog.deleteMany({ where: { actorProfileId: actor.id } });
      await prisma.membership.deleteMany({
        where: { profileId: { in: [firstAdvisor.id, secondAdvisor.id, actor.id] } },
      });
      await prisma.profile.deleteMany({ where: { id: { in: [firstAdvisor.id, secondAdvisor.id, actor.id] } } });
    }
  });
});
