import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createInvestment, registerInvestmentEvent, registerInvestmentIncome } from "@/lib/entries/investment";
import { createTestPerson, createTestWallet, createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("investimentos (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let investmentWalletId: string;
  let realWalletId: string;
  let responsibleId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [investmentWallet, realWallet, responsible] = await Promise.all([
      createTestWallet(workspaceId, "CONTA_INVESTIMENTO"),
      createTestWallet(workspaceId, "CONTA_BANCARIA"),
      createTestPerson(workspaceId),
    ]);
    investmentWalletId = investmentWallet.id;
    realWalletId = realWallet.id;
    responsibleId = responsible.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("createInvestment cria a posição e o lançamento de aporte na mesma transação", async () => {
    const investment = await createInvestment(workspaceId, profileId, {
      name: "[teste] Tesouro IPCA+ 2029",
      classCode: "RENDA_FIXA",
      walletId: investmentWalletId,
      responsibleId,
      acquisitionDate: "2026-08-10",
      acquisitionAmount: "5000.00",
      details: { instrumentType: "Tesouro IPCA+" },
    });

    expect(investment.workspaceId).toBe(workspaceId);
    expect(investment.classCode).toBe("RENDA_FIXA");

    const linkedEntries = await prisma.entry.findMany({ where: { investmentId: investment.id } });
    expect(linkedEntries).toHaveLength(1);
    expect(linkedEntries[0].nature).toBe("INVESTIMENTO");
    expect(linkedEntries[0].statusCode).toBe("AQUISICAO");
    expect(linkedEntries[0].amount.toString()).toBe("5000");
  });

  it("registerInvestmentEvent registra ganho de capital sem tocar o lançamento de aporte", async () => {
    const investment = await createInvestment(workspaceId, profileId, {
      name: "[teste] CDB 110% CDI",
      classCode: "RENDA_FIXA",
      walletId: investmentWalletId,
      responsibleId,
      acquisitionDate: "2026-08-10",
      acquisitionAmount: "3000.00",
      details: {},
    });

    await registerInvestmentEvent(workspaceId, profileId, {
      investmentId: investment.id,
      categorySlug: "ganho_de_capital",
      date: "2026-09-10",
      amount: "120.50",
      responsibleId,
    });

    const linkedEntries = await prisma.entry.findMany({
      where: { investmentId: investment.id },
      orderBy: { transactionDate: "asc" },
    });
    expect(linkedEntries).toHaveLength(2);
    expect(linkedEntries[0].statusCode).toBe("AQUISICAO");
    expect(linkedEntries[1].statusCode).toBe("ATUALIZACAO");
    expect(linkedEntries[1].amount.toString()).toBe("120.5");
    expect(linkedEntries[1].walletId).toBe(investmentWalletId);
  });

  it("registerInvestmentIncome grava renda real numa carteira de verdade, ligada à posição", async () => {
    const investment = await createInvestment(workspaceId, profileId, {
      name: "[teste] Apartamento Rua Teste",
      classCode: "IMOVEIS",
      walletId: investmentWalletId,
      responsibleId,
      acquisitionDate: "2026-08-10",
      acquisitionAmount: "250000.00",
      details: {},
    });

    const income = await registerInvestmentIncome(workspaceId, profileId, {
      investmentId: investment.id,
      walletId: realWalletId,
      categorySlug: "aluguel",
      date: "2026-09-01",
      amount: "1800.00",
      responsibleId,
    });

    expect(income.nature).toBe("RECEITA");
    expect(income.statusCode).toBe("RECEBIDO");
    expect(income.walletId).toBe(realWalletId);
    expect(income.investmentId).toBe(investment.id);
  });
});
