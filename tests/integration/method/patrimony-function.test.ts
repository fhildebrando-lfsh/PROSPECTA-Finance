import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { investmentPositionValue } from "@/lib/finance/investment";
import { walletBalance } from "@/lib/finance/balance";
import { toFinanceEntry } from "@/lib/finance/from-db";
import {
  buildPatrimonyItems,
  computeFunctionMap,
  unclassifiedFindings,
  type PatrimonyItem,
} from "@/lib/method/patrimony-function";
import { createTestWorkspace, cleanupTestWorkspace, createTestWallet, createTestPerson, categoryBySlug } from "../helpers/fixtures";

describe("Função do Patrimônio — Etapa 7 (integração, 2026-08-15)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletId: string;
  let responsibleId: string;
  let assetId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, responsible] = await Promise.all([
      createTestWallet(workspaceId, "CONTA_BANCARIA"),
      createTestPerson(workspaceId),
    ]);
    walletId = wallet.id;
    responsibleId = responsible.id;

    const bensCategoria = await categoryBySlug("OUTRO", "bens_de_uso_tangivel");
    const asset = await prisma.asset.create({
      data: { workspaceId, categoryId: bensCategoria.id, name: "[teste] carro" },
    });
    assetId = asset.id;

    const dueDate = new Date(Date.UTC(2026, 0, 10));
    await prisma.entry.create({
      data: {
        workspaceId,
        walletId,
        assetId,
        nature: "OUTRO",
        categoryId: bensCategoria.id,
        responsibleId,
        description: "[teste] aquisição do carro",
        amount: "50000.00",
        transactionDate: dueDate,
        dueDate,
        recurrenceCode: "UNICA",
        statusCode: "AQUISICAO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  /**
   * Espelha exatamente o que `app/(app)/patrimonio/funcao/page.tsx` faz —
   * mesmas queries, e o mesmo `buildPatrimonyItems` para montar os itens. A
   * primeira versão deste helper reimplementava a montagem, e foi por isso que
   * a dupla contagem passou batida: o teste e a tela podiam divergir.
   */
  async function buildItems(): Promise<PatrimonyItem[]> {
    const today = new Date();
    const [assets, investments, wallets, assetEntries, investmentEntries, walletEntries] = await Promise.all([
      prisma.asset.findMany({ where: { workspaceId, isActive: true } }),
      prisma.investment.findMany({ where: { workspaceId, isActive: true } }),
      prisma.wallet.findMany({
        where: { workspaceId, isActive: true, isPseudoWallet: false, kind: { isLiability: false } },
      }),
      prisma.entry.findMany({
        where: { workspaceId, assetId: { not: null } },
        select: { id: true, assetId: true, amount: true, statusCode: true },
      }),
      prisma.entry.findMany({
        where: { workspaceId, investmentId: { not: null }, nature: "INVESTIMENTO" },
        select: { investmentId: true, amount: true, category: { select: { slug: true } } },
      }),
      prisma.entry.findMany({
        where: { workspaceId },
        select: {
          id: true,
          walletId: true,
          categoryId: true,
          nature: true,
          amount: true,
          transactionDate: true,
          dueDate: true,
          statusCode: true,
          recurrenceCode: true,
          isFixedOverride: true,
          groupId: true,
        },
      }),
    ]);

    const financeEntries = walletEntries.map(toFinanceEntry);

    return buildPatrimonyItems({
      assets: assets.map((a) => ({
        id: a.id,
        name: a.name,
        value: assetCurrentValue(
          assetEntries
            .filter((e) => e.assetId === a.id)
            .map((e) => ({
              id: e.id,
              assetId: e.assetId,
              amount: e.amount,
              status: e.statusCode as AssetValuationEntry["status"],
            })),
        ),
        funcao: a.funcaoPatrimonial,
      })),
      investments: investments.map((i) => ({
        id: i.id,
        name: i.name,
        walletId: i.walletId,
        value: investmentPositionValue(
          investmentEntries
            .filter((e) => e.investmentId === i.id)
            .map((e) => ({ amount: e.amount, categorySlug: e.category.slug })),
        ),
        funcao: i.funcaoPatrimonial,
      })),
      wallets: wallets.map((w) => ({
        id: w.id,
        name: w.name,
        balance: walletBalance(financeEntries, w.id, today),
        funcao: w.funcaoPatrimonial,
      })),
    });
  }

  it("bem nasce sem função — aparece no achado automático com o valor real dos lançamentos", async () => {
    const items = await buildItems();
    const findings = unclassifiedFindings(items);

    const carro = findings.find((f) => f.id === assetId);
    expect(carro).toBeDefined();
    expect(carro?.value.toString()).toBe("50000");
  });

  it("classificar o bem tira ele do achado e move o valor para a fatia certa", async () => {
    await prisma.asset.update({ where: { id: assetId, workspaceId }, data: { funcaoPatrimonial: "USO" } });

    const items = await buildItems();
    const map = computeFunctionMap(items);
    const findings = unclassifiedFindings(items);

    expect(findings.find((f) => f.id === assetId)).toBeUndefined();
    expect(map.slices.find((s) => s.funcao === "USO")!.total.toString()).toBe("50000");
    expect(map.semFuncao.toString()).toBe("0");
  });

  it("limpar a classificação devolve o bem para 'sem função'", async () => {
    await prisma.asset.update({ where: { id: assetId, workspaceId }, data: { funcaoPatrimonial: null } });

    const items = await buildItems();
    const map = computeFunctionMap(items);

    expect(map.slices.find((s) => s.funcao === "USO")!.total.toString()).toBe("0");
    expect(map.semFuncao.toString()).toBe("50000");
  });

  it("lançamento de patrimônio (AQUISICAO) não entra no saldo da carteira — nada é contado duas vezes", async () => {
    const items = await buildItems();
    const carteira = items.find((i) => i.kind === "CARTEIRA" && i.id === walletId);

    // O único Entry do workspace é a aquisição do bem, com status AQUISICAO —
    // fora de SETTLED_FOR_BALANCE de propósito (lib/finance/balance.ts).
    expect(carteira?.value.toString()).toBe("0");
    expect(computeFunctionMap(items).total.toString()).toBe("50000");
  });

  /**
   * Regressão do achado de revisão (2026-08-15): o teste acima provava que
   * AQUISICAO não entra no saldo — verdadeiro, mas insuficiente. O dinheiro
   * chega na carteira de investimento por TRANSFERÊNCIA (pernas `PAGO`, que
   * contam no saldo) e a compra não debita o caixa. Sem desconto, a mesma
   * quantia era contada duas vezes.
   */
  it("posição de investimento não é contada duas vezes com o saldo da carteira que a abriga", async () => {
    const corretora = await createTestWallet(workspaceId, "CONTA_INVESTIMENTO");
    const transferencias = await categoryBySlug("OUTRO", "transferencias");
    const aportes = await categoryBySlug("INVESTIMENTO", "aportes");
    const date = new Date(Date.UTC(2026, 1, 10));

    // (1) Transferência de R$ 10.000 pra corretora — perna de entrada, PAGO.
    const pernaEntrada = await prisma.entry.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        nature: "OUTRO",
        categoryId: transferencias.id,
        responsibleId,
        description: "[teste] entrada na corretora",
        amount: "10000.00",
        transactionDate: date,
        dueDate: date,
        recurrenceCode: "UNICA",
        statusCode: "PAGO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    // (2) Compra do CDB de R$ 10.000 na mesma carteira — AQUISICAO, não debita o caixa.
    const cdb = await prisma.investment.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        classCode: "RENDA_FIXA",
        name: "[teste] CDB",
        details: { classCode: "RENDA_FIXA" },
      },
    });
    const aporte = await prisma.entry.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        investmentId: cdb.id,
        nature: "INVESTIMENTO",
        categoryId: aportes.id,
        responsibleId,
        description: "[teste] CDB",
        amount: "10000.00",
        transactionDate: date,
        dueDate: date,
        recurrenceCode: "UNICA",
        statusCode: "AQUISICAO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    try {
      const items = await buildItems();
      const carteira = items.find((i) => i.kind === "CARTEIRA" && i.id === corretora.id);
      const posicao = items.find((i) => i.kind === "INVESTIMENTO" && i.id === cdb.id);

      expect(posicao?.value.toString()).toBe("10000");
      // Saldo 10.000 − posição 10.000 = 0 de caixa não alocado.
      expect(carteira?.value.toString()).toBe("0");

      // O bem de 50.000 do beforeAll continua sem função neste ponto do arquivo.
      expect(computeFunctionMap(items).total.toString()).toBe("60000");
    } finally {
      await prisma.entry.deleteMany({ where: { id: { in: [pernaEntrada.id, aporte.id] } } });
      await prisma.investment.delete({ where: { id: cdb.id } });
      await prisma.wallet.delete({ where: { id: corretora.id } });
    }
  });

  it("caixa não alocado na corretora continua aparecendo (transferiu mais do que investiu)", async () => {
    const corretora = await createTestWallet(workspaceId, "CONTA_INVESTIMENTO");
    const transferencias = await categoryBySlug("OUTRO", "transferencias");
    const aportes = await categoryBySlug("INVESTIMENTO", "aportes");
    const date = new Date(Date.UTC(2026, 1, 10));

    const pernaEntrada = await prisma.entry.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        nature: "OUTRO",
        categoryId: transferencias.id,
        responsibleId,
        description: "[teste] entrada na corretora",
        amount: "15000.00",
        transactionDate: date,
        dueDate: date,
        recurrenceCode: "UNICA",
        statusCode: "PAGO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });
    const cdb = await prisma.investment.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        classCode: "RENDA_FIXA",
        name: "[teste] CDB parcial",
        details: { classCode: "RENDA_FIXA" },
      },
    });
    const aporte = await prisma.entry.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        investmentId: cdb.id,
        nature: "INVESTIMENTO",
        categoryId: aportes.id,
        responsibleId,
        description: "[teste] CDB parcial",
        amount: "10000.00",
        transactionDate: date,
        dueDate: date,
        recurrenceCode: "UNICA",
        statusCode: "AQUISICAO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    try {
      const items = await buildItems();
      const carteira = items.find((i) => i.kind === "CARTEIRA" && i.id === corretora.id);
      expect(carteira?.value.toString()).toBe("5000");
    } finally {
      await prisma.entry.deleteMany({ where: { id: { in: [pernaEntrada.id, aporte.id] } } });
      await prisma.investment.delete({ where: { id: cdb.id } });
      await prisma.wallet.delete({ where: { id: corretora.id } });
    }
  });

  it("posição cadastrada sem transferência não gera saldo negativo fantasma", async () => {
    const corretora = await createTestWallet(workspaceId, "CONTA_INVESTIMENTO");
    const aportes = await categoryBySlug("INVESTIMENTO", "aportes");
    const date = new Date(Date.UTC(2026, 1, 10));

    const cdb = await prisma.investment.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        classCode: "RENDA_FIXA",
        name: "[teste] CDB preexistente",
        details: { classCode: "RENDA_FIXA" },
      },
    });
    const aporte = await prisma.entry.create({
      data: {
        workspaceId,
        walletId: corretora.id,
        investmentId: cdb.id,
        nature: "INVESTIMENTO",
        categoryId: aportes.id,
        responsibleId,
        description: "[teste] CDB preexistente",
        amount: "10000.00",
        transactionDate: date,
        dueDate: date,
        recurrenceCode: "UNICA",
        statusCode: "AQUISICAO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });

    try {
      const items = await buildItems();
      const carteira = items.find((i) => i.kind === "CARTEIRA" && i.id === corretora.id);
      expect(carteira?.value.toString()).toBe("0");
    } finally {
      await prisma.entry.delete({ where: { id: aporte.id } });
      await prisma.investment.delete({ where: { id: cdb.id } });
      await prisma.wallet.delete({ where: { id: corretora.id } });
    }
  });

  it("carteira de passivo (cartão de crédito) fica fora da classificação funcional", async () => {
    const cartao = await createTestWallet(workspaceId, "CARTAO_CREDITO");
    try {
      const items = await buildItems();
      expect(items.find((i) => i.id === cartao.id)).toBeUndefined();
    } finally {
      await prisma.wallet.delete({ where: { id: cartao.id } });
    }
  });
});
