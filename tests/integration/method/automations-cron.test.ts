import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { runDueAutomations } from "@/lib/method/run-automations";
import { createTestWorkspace, cleanupTestWorkspace, createTestWallet, createTestPerson, categoryBySlug } from "../helpers/fixtures";

describe("runDueAutomations (integração — Etapa 6, 2026-08-15)", () => {
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

  afterEach(async () => {
    await prisma.automationRule.deleteMany({ where: { workspaceId } });
    await prisma.notification.deleteMany({ where: { workspaceId } });
    await prisma.entry.deleteMany({ where: { workspaceId } });
  });

  it("não cria notificação quando a regra não dispara", async () => {
    const categoria = await categoryBySlug("DESPESA", "1_alimentacao");
    await prisma.automationRule.create({
      data: {
        workspaceId,
        trigger: "LIMIAR_CATEGORIA",
        condition: { categoryId: categoria.id, categoryName: categoria.name, thresholdAmount: 99999 },
        createdBy: profileId,
      },
    });
    const dueDate = new Date();
    await prisma.entry.create({
      data: {
        workspaceId,
        walletId,
        nature: "DESPESA",
        categoryId: categoria.id,
        responsibleId,
        description: "[teste] mercado",
        amount: "-50.00",
        transactionDate: dueDate,
        dueDate,
        recurrenceCode: "UNICA",
        statusCode: "PAGO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    const result = await runDueAutomations(dueDate);
    expect(result.notified).toBe(0);

    const notifications = await prisma.notification.findMany({ where: { workspaceId } });
    expect(notifications).toHaveLength(0);
  });

  it("cria uma Notification quando a regra de limiar de categoria dispara", async () => {
    const categoria = await categoryBySlug("DESPESA", "1_alimentacao");
    await prisma.automationRule.create({
      data: {
        workspaceId,
        trigger: "LIMIAR_CATEGORIA",
        condition: { categoryId: categoria.id, categoryName: categoria.name, thresholdAmount: 10 },
        createdBy: profileId,
      },
    });
    const dueDate = new Date();
    await prisma.entry.create({
      data: {
        workspaceId,
        walletId,
        nature: "DESPESA",
        categoryId: categoria.id,
        responsibleId,
        description: "[teste] mercado",
        amount: "-500.00",
        transactionDate: dueDate,
        dueDate,
        recurrenceCode: "UNICA",
        statusCode: "PAGO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    const result = await runDueAutomations(dueDate);
    expect(result.notified).toBe(1);

    const notifications = await prisma.notification.findMany({ where: { workspaceId } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].visibility).toBe("SHARED");
    expect(notifications[0].message).toContain(categoria.name);
  });

  it("ignora regra inativa", async () => {
    const categoria = await categoryBySlug("DESPESA", "1_alimentacao");
    await prisma.automationRule.create({
      data: {
        workspaceId,
        trigger: "LIMIAR_CATEGORIA",
        condition: { categoryId: categoria.id, categoryName: categoria.name, thresholdAmount: 10 },
        createdBy: profileId,
        isActive: false,
      },
    });
    const dueDate = new Date();
    await prisma.entry.create({
      data: {
        workspaceId,
        walletId,
        nature: "DESPESA",
        categoryId: categoria.id,
        responsibleId,
        description: "[teste] mercado",
        amount: "-500.00",
        transactionDate: dueDate,
        dueDate,
        recurrenceCode: "UNICA",
        statusCode: "PAGO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    const result = await runDueAutomations(dueDate);
    expect(result.notified).toBe(0);
  });

  it("dispara META_FORA_DA_TRAJETORIA quando o saldo da carteira da meta está abaixo do ritmo", async () => {
    const metaWallet = await createTestWallet(workspaceId, "CONTA_CAIXA");
    const createdAt = new Date(Date.UTC(2026, 0, 1));
    const targetDate = new Date(Date.UTC(2027, 0, 1));
    const today = new Date(Date.UTC(2026, 6, 1)); // ~50% do caminho

    const goal = await prisma.goal.create({
      data: {
        workspaceId,
        walletId: metaWallet.id,
        name: "[teste] reserva",
        targetAmount: "12000.00",
        targetDate,
        createdAt,
      },
    });

    await prisma.automationRule.create({
      data: { workspaceId, trigger: "META_FORA_DA_TRAJETORIA", condition: {}, createdBy: profileId },
    });

    try {
      const result = await runDueAutomations(today);
      expect(result.notified).toBe(1);
      const notifications = await prisma.notification.findMany({ where: { workspaceId } });
      expect(notifications[0].message).toContain("reserva");
    } finally {
      await prisma.goal.delete({ where: { id: goal.id } });
    }
  });
});
