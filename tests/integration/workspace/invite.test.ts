import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { acceptInvite, createInvite } from "@/lib/workspace/invite";
import { ApiError } from "@/lib/api/errors";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("convite de workspace (integração)", () => {
  let workspaceId: string;
  let titularProfileId: string;

  beforeAll(async () => {
    const workspace = await createTestWorkspace();
    workspaceId = workspace.workspaceId;
    titularProfileId = workspace.profileId;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, titularProfileId);
  });

  it("cria um convite pendente e aceita com o papel correto", async () => {
    const email = `teste+${randomUUID().slice(0, 8)}@example.com`;
    const invite = await createInvite(workspaceId, titularProfileId, email, "MEMBRO");

    expect(invite.workspaceId).toBe(workspaceId);
    expect(invite.acceptedAt).toBeNull();

    const invitedProfile = await prisma.profile.create({
      data: { id: randomUUID(), fullName: "[teste] convidado" },
    });

    try {
      const membership = await acceptInvite(invite.token, invitedProfile.id, email);
      expect(membership.workspaceId).toBe(workspaceId);
      expect(membership.profileId).toBe(invitedProfile.id);
      expect(membership.role).toBe("MEMBRO");

      const updatedInvite = await prisma.workspaceInvite.findUnique({ where: { token: invite.token } });
      expect(updatedInvite?.acceptedAt).not.toBeNull();
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: invitedProfile.id } });
      await prisma.profile.delete({ where: { id: invitedProfile.id } });
    }
  });

  it("rejeita aceitar com e-mail diferente do convite", async () => {
    const email = `teste+${randomUUID().slice(0, 8)}@example.com`;
    const invite = await createInvite(workspaceId, titularProfileId, email, "LEITURA");

    const invitedProfile = await prisma.profile.create({
      data: { id: randomUUID(), fullName: "[teste] convidado errado" },
    });

    try {
      await expect(acceptInvite(invite.token, invitedProfile.id, "outro@example.com")).rejects.toThrow(ApiError);
    } finally {
      await prisma.profile.delete({ where: { id: invitedProfile.id } });
    }
  });

  it("rejeita convite já aceito", async () => {
    const email = `teste+${randomUUID().slice(0, 8)}@example.com`;
    const invite = await createInvite(workspaceId, titularProfileId, email, "MEMBRO");
    const invitedProfile = await prisma.profile.create({
      data: { id: randomUUID(), fullName: "[teste] convidado duas vezes" },
    });

    try {
      await acceptInvite(invite.token, invitedProfile.id, email);

      const secondProfile = await prisma.profile.create({
        data: { id: randomUUID(), fullName: "[teste] segunda tentativa" },
      });
      try {
        await expect(acceptInvite(invite.token, secondProfile.id, email)).rejects.toThrow(ApiError);
      } finally {
        await prisma.profile.delete({ where: { id: secondProfile.id } });
      }
    } finally {
      await prisma.membership.deleteMany({ where: { profileId: invitedProfile.id } });
      await prisma.profile.delete({ where: { id: invitedProfile.id } });
    }
  });
});
