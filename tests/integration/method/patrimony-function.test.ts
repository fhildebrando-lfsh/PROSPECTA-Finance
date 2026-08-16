import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { assetCurrentValue, type AssetValuationEntry } from "@/lib/finance/patrimony";
import { investmentPositionValue } from "@/lib/finance/investment";
import { walletBalance } from "@/lib/finance/balance";
import { toFinanceEntry } from "@/lib/finance/from-db";
import { computeFunctionMap, unclassifiedFindings, type PatrimonyItem } from "@/lib/method/patrimony-function";
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

  async function buildItems(): Promise<PatrimonyItem[]> {
    const today = new Date();
    const [assets, wallets, assetEntries, walletEntries] = await Promise.all([
      prisma.asset.findMany({ where: { workspaceId, isActive: true } }),
      prisma.wallet.findMany({ where: { workspaceId, isActive: true, kind: { isLiability: false } } }),
      prisma.entry.findMany({
        where: { workspaceId, assetId: { not: null } },
        select: { id: true, assetId: true, amount: true, statusCode: true },
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

    return [
      ...assets.map((a) => ({
        id: a.id,
        kind: "BEM" as const,
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
      ...wallets.map((w) => ({
        id: w.id,
        kind: "CARTEIRA" as const,
        name: w.name,
        value: walletBalance(financeEntries, w.id, today),
        funcao: w.funcaoPatrimonial,
      })),
    ];
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
