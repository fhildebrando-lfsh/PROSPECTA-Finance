import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { averageMonthlyExpense, averageMonthlyIncome } from "@/lib/finance/reserve";
import { walletBalance } from "@/lib/finance/balance";
import { Decimal } from "@/lib/finance/types";
import { organizacao, endividamento, liquidez } from "@/lib/method/psf";
import { computeConsistencyIndex, coberturaTemporal, qualidadeCategorizacao, filaDeIncidentes, coberturaDeCarteiras, conciliacao } from "@/lib/method/consistency";
import { createTestWorkspace, cleanupTestWorkspace, createTestWallet, createTestPerson, categoryBySlug } from "../helpers/fixtures";

describe("PSF — fluxo ponta a ponta com dado real (integração — Etapa 5, 2026-08-15)", () => {
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
    await prisma.healthSnapshot.deleteMany({ where: { workspaceId } });
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("Organização/Endividamento/Liquidez calculados a partir de Entry reais batem com o esperado", async () => {
    const categoriaSalario = await categoryBySlug("RECEITA", "salario_liquido");
    const categoriaAlimentacao = await categoryBySlug("DESPESA", "1_alimentacao");
    const today = new Date(Date.UTC(2026, 5, 15));
    const mesFechado = new Date(Date.UTC(2026, 4, 10)); // maio, mês fechado em relação a today

    const baseEntry = {
      workspaceId,
      walletId,
      responsibleId,
      transactionDate: mesFechado,
      dueDate: mesFechado,
      recurrenceCode: "UNICA",
      statusCode: "RECEBIDO",
      createdBy: profileId,
      updatedBy: profileId,
    };

    const created = await prisma.$transaction([
      prisma.entry.create({
        data: { ...baseEntry, nature: "RECEITA", categoryId: categoriaSalario.id, description: "[teste] salário", amount: "5000.00" },
      }),
      prisma.entry.create({
        data: {
          ...baseEntry,
          nature: "DESPESA",
          categoryId: categoriaAlimentacao.id,
          description: "[teste] supermercado",
          amount: "-1000.00",
          statusCode: "PAGO",
        },
      }),
    ]);

    try {
      const dbEntries = await prisma.entry.findMany({
        where: { id: { in: created.map((e) => e.id) } },
        select: {
          id: true,
          walletId: true,
          categoryId: true,
          subcategoryId: true,
          nature: true,
          amount: true,
          transactionDate: true,
          dueDate: true,
          statusCode: true,
          recurrenceCode: true,
          isFixedOverride: true,
          groupId: true,
        },
      });
      const financeEntries = dbEntries.map(toFinanceEntry);

      const avgIncome = averageMonthlyIncome(financeEntries, today, 6);
      const avgExpense = averageMonthlyExpense(financeEntries, today, 6);
      expect(avgIncome.toNumber()).toBeCloseTo(5000 / 6, 5);
      expect(avgExpense.toNumber()).toBeCloseTo(1000 / 6, 5);

      // Sem dívida nenhuma — Endividamento deve ser perfeito (100).
      const endividamentoResult = endividamento(new Decimal(0), avgIncome);
      expect(endividamentoResult.valor).toBe(100);

      // Saldo líquido da carteira (receita liquidada - despesa liquidada) ÷ despesa média.
      const liquidBalance = walletBalance(financeEntries, walletId, today);
      expect(liquidBalance.toNumber()).toBe(4000); // 5000 - 1000

      const liquidezResult = liquidez(liquidBalance, avgExpense);
      // 4000 / (1000/6) = 24 meses de fôlego — bem acima do alvo de 6, trava em 100.
      expect(liquidezResult.valor).toBe(100);
      expect(liquidezResult.faixa).toBe("consolidado");
    } finally {
      await prisma.entry.deleteMany({ where: { id: { in: created.map((e) => e.id) } } });
    }
  });

  it("Índice de Consistência calculado com incidente reconhecido não conta como aberto", async () => {
    const dbEntries = await prisma.entry.findMany({
      where: { workspaceId },
      select: { dueDate: true, subcategoryId: true, walletId: true },
    });
    const period = { start: new Date(Date.UTC(2026, 0, 1)), end: new Date(Date.UTC(2026, 5, 30)) };
    const activeWalletIds = [walletId];

    const index = computeConsistencyIndex({
      coberturaTemporal: coberturaTemporal(dbEntries, period),
      qualidadeCategorizacao: qualidadeCategorizacao(dbEntries, period),
      filaDeIncidentes: filaDeIncidentes([], new Date()),
      coberturaDeCarteiras: coberturaDeCarteiras(dbEntries, activeWalletIds, period),
      conciliacao: conciliacao([], activeWalletIds),
    });

    expect(index.overall).not.toBeNull();
    const organizacaoResult = organizacao(index.overall);
    expect(organizacaoResult.valor).toBe(index.overall);
  });

  it("saveHealthSnapshot (via prisma direto) grava e lê de volta os indicadores", async () => {
    const snapshot = await prisma.healthSnapshot.create({
      data: {
        workspaceId,
        snapshotDate: new Date(),
        indicators: {
          organizacao: { faixa: "saudavel", valor: 70 },
          endividamento: { faixa: "consolidado", valor: 100 },
          liquidez: { faixa: "consolidado", valor: 100 },
          protecao: null,
          construcao: null,
        },
        origin: "AUTO",
      },
    });

    const found = await prisma.healthSnapshot.findUnique({ where: { id: snapshot.id } });
    expect(found?.origin).toBe("AUTO");
    expect((found?.indicators as { organizacao: { valor: number } }).organizacao.valor).toBe(70);
  });
});
