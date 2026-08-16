import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { reconcileWalletBalance, latestReconciliationByWallet } from "@/lib/method/reconciliation";
import { createTestWorkspace, cleanupTestWorkspace, createTestWallet, createTestPerson, categoryBySlug } from "../helpers/fixtures";

describe("reconcileWalletBalance (integração — Etapa 2, 2026-08-15)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletId: string;
  let responsibleId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, responsible] = await Promise.all([createTestWallet(workspaceId), createTestPerson(workspaceId)]);
    walletId = wallet.id;
    responsibleId = responsible.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("calcula o saldo do sistema a partir dos Entry reais e grava os dois valores", async () => {
    const categoria = await categoryBySlug("RECEITA", "salario_liquido");
    const dueDate = new Date(Date.UTC(2026, 0, 10));
    const entry = await prisma.entry.create({
      data: {
        workspaceId,
        walletId,
        nature: "RECEITA",
        categoryId: categoria.id,
        responsibleId,
        description: "[teste] salário",
        amount: "1000.00",
        transactionDate: dueDate,
        dueDate,
        recurrenceCode: "UNICA",
        statusCode: "RECEBIDO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    try {
      const result = await reconcileWalletBalance({
        workspaceId,
        walletId,
        declaredBalance: "1000.00",
        checkedBy: profileId,
      });

      expect(result.systemBalance.toString()).toBe("1000");
      expect(result.declaredBalance.toString()).toBe("1000");
      expect(result.checkedBy).toBe(profileId);
    } finally {
      await prisma.entry.delete({ where: { id: entry.id } });
    }
  });

  it("registra diferença quando o saldo declarado não bate com o do sistema", async () => {
    const result = await reconcileWalletBalance({
      workspaceId,
      walletId,
      declaredBalance: "500.00",
      checkedBy: profileId,
    });

    // sem nenhum Entry ativo agora (o do teste anterior foi removido) — sistema calcula 0
    expect(result.systemBalance.toString()).toBe("0");
    expect(result.declaredBalance.toString()).toBe("500");
  });

  it("lança erro para carteira que não pertence ao workspace", async () => {
    const outro = await createTestWorkspace();
    try {
      await expect(
        reconcileWalletBalance({
          workspaceId: outro.workspaceId,
          walletId, // pertence ao workspace principal, não ao "outro"
          declaredBalance: "100.00",
          checkedBy: profileId,
        }),
      ).rejects.toThrow(/não encontrada/);
    } finally {
      await cleanupTestWorkspace(outro.workspaceId, outro.profileId);
    }
  });

  it("latestReconciliationByWallet devolve só a checagem mais recente de cada carteira", async () => {
    const wallet2 = await createTestWallet(workspaceId);

    await reconcileWalletBalance({ workspaceId, walletId: wallet2.id, declaredBalance: "10.00", checkedBy: profileId });
    await new Promise((r) => setTimeout(r, 5)); // garante checkedAt diferente
    await reconcileWalletBalance({ workspaceId, walletId: wallet2.id, declaredBalance: "20.00", checkedBy: profileId });

    const latest = await latestReconciliationByWallet(workspaceId);
    expect(latest.get(wallet2.id)?.declaredBalance.toString()).toBe("20");
  });
});
