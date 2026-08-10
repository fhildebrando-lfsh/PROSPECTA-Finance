import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { settleEntry } from "@/lib/entries/settle";
import { ApiError } from "@/lib/api/errors";
import { categoryBySlug, createTestPerson, createTestWallet, createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("settleEntry (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletId: string;
  let responsibleId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, responsible, category] = await Promise.all([
      createTestWallet(workspaceId),
      createTestPerson(workspaceId),
      categoryBySlug("RECEITA", "aluguel"),
    ]);
    walletId = wallet.id;
    responsibleId = responsible.id;
    categoryId = category.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  async function createPendingEntry(statusCode: "A_PAGAR" | "A_RECEBER") {
    return prisma.entry.create({
      data: {
        workspaceId,
        walletId,
        categoryId,
        responsibleId,
        nature: "RECEITA",
        amount: "300.00",
        description: "[teste] a liquidar",
        transactionDate: new Date("2026-08-10"),
        dueDate: new Date("2026-08-10"),
        statusCode,
        recurrenceCode: "UNICA",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });
  }

  it("liquida A_RECEBER -> RECEBIDO e grava settledAt", async () => {
    const entry = await createPendingEntry("A_RECEBER");

    const updated = await settleEntry(entry.id, workspaceId, profileId);

    expect(updated.statusCode).toBe("RECEBIDO");
    expect(updated.settledAt).not.toBeNull();
    expect(updated.updatedBy).toBe(profileId);
  });

  it("rejeita lançamento de outro workspace", async () => {
    const { workspaceId: otherWorkspaceId, profileId: otherProfileId } = await createTestWorkspace();
    try {
      const entry = await createPendingEntry("A_PAGAR");
      await expect(settleEntry(entry.id, otherWorkspaceId, otherProfileId)).rejects.toThrow(ApiError);
    } finally {
      await cleanupTestWorkspace(otherWorkspaceId, otherProfileId);
    }
  });

  it("rejeita situação que não é liquidável por este atalho", async () => {
    const entry = await createPendingEntry("A_PAGAR");
    await prisma.entry.update({ where: { id: entry.id }, data: { statusCode: "ISENTO" } });

    await expect(settleEntry(entry.id, workspaceId, profileId)).rejects.toThrow(ApiError);
  });
});
