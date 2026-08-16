import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { toAllocationEntry } from "@/lib/method/from-db";
import { computeAllocation, percentOfIncome } from "@/lib/method/allocation";
import { monthRange } from "@/lib/finance/dates";
import { createTestWorkspace, cleanupTestWorkspace, createTestWallet, createTestPerson, categoryBySlug } from "../helpers/fixtures";

describe("Régua de Alocação — seed real + fluxo ponta a ponta (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletId: string;
  let caixinhaId: string;
  let responsibleId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, caixinha, responsible] = await Promise.all([
      createTestWallet(workspaceId, "CONTA_BANCARIA"),
      createTestWallet(workspaceId, "CONTA_CAIXA"),
      createTestPerson(workspaceId),
    ]);
    walletId = wallet.id;
    caixinhaId = caixinha.id;
    responsibleId = responsible.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("o seed classificou as subcategorias reais conforme as decisões do usuário (2026-08-15)", async () => {
    const [supermercado, restaurante, financiamentoHabitacao, uniformeEscolar] = await Promise.all([
      prisma.subcategory.findFirst({ where: { slug: "supermercado", category: { slug: "1_alimentacao" } } }),
      prisma.subcategory.findFirst({ where: { slug: "restaurante", category: { slug: "1_alimentacao" } } }),
      prisma.subcategory.findFirst({ where: { slug: "financiamento", category: { slug: "2_habitacao" } } }),
      prisma.subcategory.findFirst({ where: { slug: "uniforme_escolar", category: { slug: "4_vestuario" } } }),
    ]);

    expect(supermercado?.macroBloco).toBe("ESSENCIAL");
    expect(restaurante?.macroBloco).toBe("ESTILO_DE_VIDA");
    // Decisão do usuário 2026-08-15: financiamento fica Essencial, não Obrigação
    // (diverge da leitura literal de §11.2 de propósito).
    expect(financiamentoHabitacao?.macroBloco).toBe("ESSENCIAL");
    // Vestuário conforme o método — só uniforme é Essencial, resto Estilo de vida.
    expect(uniformeEscolar?.macroBloco).toBe("ESSENCIAL");
  });

  it("computeAllocation, a partir de Entry reais no banco, bate com o esperado", async () => {
    const [categoriaAlimentacao, subSupermercado, subRestaurante, categoriaTransferencias, categoriaAportes, categoriaSalario] =
      await Promise.all([
        categoryBySlug("DESPESA", "1_alimentacao"),
        prisma.subcategory.findFirstOrThrow({ where: { slug: "supermercado", category: { slug: "1_alimentacao" } } }),
        prisma.subcategory.findFirstOrThrow({ where: { slug: "restaurante", category: { slug: "1_alimentacao" } } }),
        categoryBySlug("OUTRO", "transferencias"),
        categoryBySlug("INVESTIMENTO", "aportes"),
        categoryBySlug("RECEITA", "salario_liquido"),
      ]);

    const dueDate = new Date(Date.UTC(2026, 5, 15));
    const baseEntry = {
      workspaceId,
      transactionDate: dueDate,
      dueDate,
      responsibleId,
      recurrenceCode: "UNICA",
      statusCode: "PAGO",
      createdBy: profileId,
      updatedBy: profileId,
    };

    const created = await prisma.$transaction([
      // R$ 3.000 essencial (supermercado)
      prisma.entry.create({
        data: {
          ...baseEntry,
          walletId,
          nature: "DESPESA",
          categoryId: categoriaAlimentacao.id,
          subcategoryId: subSupermercado.id,
          description: "[teste] supermercado",
          amount: "-3000.00",
        },
      }),
      // R$ 500 estilo de vida (restaurante)
      prisma.entry.create({
        data: {
          ...baseEntry,
          walletId,
          nature: "DESPESA",
          categoryId: categoriaAlimentacao.id,
          subcategoryId: subRestaurante.id,
          description: "[teste] restaurante",
          amount: "-500.00",
        },
      }),
      // R$ 400 aporte em investimento (Poupança)
      prisma.entry.create({
        data: {
          ...baseEntry,
          walletId,
          nature: "INVESTIMENTO",
          categoryId: categoriaAportes.id,
          description: "[teste] aporte",
          amount: "400.00",
        },
      }),
      // R$ 200 transferência pra caixinha (Poupança) — só a perna de entrada
      prisma.entry.create({
        data: {
          ...baseEntry,
          walletId: caixinhaId,
          nature: "OUTRO",
          categoryId: categoriaTransferencias.id,
          description: "[teste] transferência pra caixinha",
          amount: "200.00",
        },
      }),
      // R$ 10.000 receita
      prisma.entry.create({
        data: {
          ...baseEntry,
          walletId,
          nature: "RECEITA",
          categoryId: categoriaSalario.id,
          description: "[teste] salário",
          amount: "10000.00",
        },
      }),
    ]);

    try {
      const dbEntries = await prisma.entry.findMany({
        where: { id: { in: created.map((e) => e.id) } },
        select: {
          id: true,
          nature: true,
          amount: true,
          transactionDate: true,
          dueDate: true,
          statusCode: true,
          macroBlocoOverride: true,
          category: { select: { slug: true } },
          subcategory: { select: { macroBloco: true } },
          wallet: { select: { kindCode: true } },
        },
      });

      const entries = dbEntries.map(toAllocationEntry);
      const period = monthRange(2026, 5);
      const totals = computeAllocation(entries, period, "settled");

      expect(totals.essencial.toNumber()).toBe(3000);
      expect(totals.estiloDeVida.toNumber()).toBe(500);
      expect(totals.poupanca.toNumber()).toBe(600); // 400 aporte + 200 transferência
      expect(totals.receita.toNumber()).toBe(10000);

      const pct = percentOfIncome(totals);
      expect(pct.essencial).toBe(30);
      expect(pct.poupanca).toBe(6);
    } finally {
      await prisma.entry.deleteMany({ where: { id: { in: created.map((e) => e.id) } } });
    }
  });
});
