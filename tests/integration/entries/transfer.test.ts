import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createTransfer } from "@/lib/entries/transfer";
import { ApiError } from "@/lib/api/errors";
import { createTestPerson, createTestWallet, createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("createTransfer (integração)", () => {
  let workspaceId: string;
  let profileId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("cria o par saída/entrada com sinais corretos, mesma categoria Transferências", async () => {
    const [fromWallet, toWallet, responsible] = await Promise.all([
      createTestWallet(workspaceId),
      createTestWallet(workspaceId),
      createTestPerson(workspaceId),
    ]);

    const [outLine, inLine] = await createTransfer(workspaceId, profileId, {
      fromWalletId: fromWallet.id,
      toWalletId: toWallet.id,
      amount: "150.00",
      date: "2026-08-10",
      responsibleId: responsible.id,
    });

    expect(outLine.walletId).toBe(fromWallet.id);
    expect(outLine.amount.toString()).toBe("-150");
    expect(inLine.walletId).toBe(toWallet.id);
    expect(inLine.amount.toString()).toBe("150");
    expect(outLine.transferId).toBe(inLine.transferId);
    expect(outLine.nature).toBe("OUTRO");
    expect(inLine.nature).toBe("OUTRO");
    expect(outLine.categoryId).toBe(inLine.categoryId);

    const category = await prisma.category.findUnique({ where: { id: outLine.categoryId } });
    expect(category?.slug).toBe("transferencias");

    const stored = await prisma.entry.findMany({ where: { transferId: outLine.transferId } });
    expect(stored).toHaveLength(2);
  });

  it("rejeita carteira de outro workspace", async () => {
    const { workspaceId: otherWorkspaceId, profileId: otherProfileId } = await createTestWorkspace();
    try {
      const [myWallet, foreignWallet, responsible] = await Promise.all([
        createTestWallet(workspaceId),
        createTestWallet(otherWorkspaceId),
        createTestPerson(workspaceId),
      ]);

      await expect(
        createTransfer(workspaceId, profileId, {
          fromWalletId: myWallet.id,
          toWalletId: foreignWallet.id,
          amount: "10.00",
          date: "2026-08-10",
          responsibleId: responsible.id,
        }),
      ).rejects.toThrow(ApiError);
    } finally {
      await cleanupTestWorkspace(otherWorkspaceId, otherProfileId);
    }
  });

  it("rejeita origem e destino iguais", async () => {
    const [wallet, responsible] = await Promise.all([createTestWallet(workspaceId), createTestPerson(workspaceId)]);

    await expect(
      createTransfer(workspaceId, profileId, {
        fromWalletId: wallet.id,
        toWalletId: wallet.id,
        amount: "10.00",
        date: "2026-08-10",
        responsibleId: responsible.id,
      }),
    ).rejects.toThrow(ApiError);
  });
});
