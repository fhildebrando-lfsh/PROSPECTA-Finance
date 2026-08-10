import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createAsset, registerAssetValuation } from "@/lib/entries/asset";
import { ApiError } from "@/lib/api/errors";
import { categoryBySlug, createTestPerson, createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

describe("bens/patrimônio (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let responsibleId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    // createAsset/registerAssetValuation exigem a carteira pseudo-conta
    // "Patrimônio" (isPseudoWallet=true), que não é escolhível pelo usuário
    // — não existe no seed de referência global, então o workspace de teste
    // precisa da sua própria, igual todo workspace real ganha.
    await prisma.wallet.create({
      data: { workspaceId, name: "[teste] Patrimônio", kindCode: "CONTA_ATIVO", slug: "teste-patrimonio", isPseudoWallet: true },
    });
    const [responsible, category] = await Promise.all([
      createTestPerson(workspaceId),
      categoryBySlug("OUTRO", "bens"),
    ]);
    responsibleId = responsible.id;
    categoryId = category.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("createAsset cria o bem e o lançamento de aquisição na pseudo-conta Patrimônio", async () => {
    const asset = await createAsset(workspaceId, profileId, {
      name: "[teste] Apartamento",
      categoryId,
      responsibleId,
      acquisitionDate: "2026-08-10",
      acquisitionAmount: "300000.00",
    });

    expect(asset.workspaceId).toBe(workspaceId);
    expect(asset.isActive).toBe(true);

    const entries = await prisma.entry.findMany({ where: { assetId: asset.id } });
    expect(entries).toHaveLength(1);
    expect(entries[0].statusCode).toBe("AQUISICAO");
    expect(entries[0].nature).toBe("OUTRO");
    expect(entries[0].amount.toString()).toBe("300000");
  });

  it("registerAssetValuation registra valorização sem tocar o lançamento de aquisição", async () => {
    const asset = await createAsset(workspaceId, profileId, {
      name: "[teste] Carro",
      categoryId,
      responsibleId,
      acquisitionDate: "2026-08-10",
      acquisitionAmount: "80000.00",
    });

    await registerAssetValuation(workspaceId, profileId, {
      assetId: asset.id,
      date: "2026-09-10",
      amount: "-4000.00",
      responsibleId,
    });

    const entries = await prisma.entry.findMany({
      where: { assetId: asset.id },
      orderBy: { transactionDate: "asc" },
    });
    expect(entries).toHaveLength(2);
    expect(entries[0].statusCode).toBe("AQUISICAO");
    expect(entries[1].statusCode).toBe("ATUALIZACAO");
    expect(entries[1].amount.toString()).toBe("-4000");
  });

  it("rejeita bem de outro workspace", async () => {
    const { workspaceId: otherWorkspaceId, profileId: otherProfileId } = await createTestWorkspace();
    try {
      const asset = await createAsset(workspaceId, profileId, {
        name: "[teste] Bem de outro workspace",
        categoryId,
        responsibleId,
        acquisitionDate: "2026-08-10",
        acquisitionAmount: "1000.00",
      });

      await expect(
        registerAssetValuation(otherWorkspaceId, otherProfileId, {
          assetId: asset.id,
          date: "2026-09-10",
          amount: "100.00",
          responsibleId,
        }),
      ).rejects.toThrow(ApiError);
    } finally {
      await cleanupTestWorkspace(otherWorkspaceId, otherProfileId);
    }
  });
});
