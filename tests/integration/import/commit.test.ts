import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { commitImportBatch } from "@/lib/import/commit";
import type { ColumnMapping } from "@/lib/import/column-mapping";
import { categoryBySlug, createTestPerson, createTestWallet, createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

// Mapeamento identidade — cada campo mapeia pra uma chave de mesmo nome no
// record, sem depender do parser de CSV (commitImportBatch recebe records
// já prontos, é a fronteira certa pra testar o núcleo transacional isolado
// do formato de entrada CSV/OFX/PDF).
const MAPPING: ColumnMapping = {
  transactionDate: "transactionDate",
  dueDate: "dueDate",
  walletName: "walletName",
  nature: "nature",
  categoryName: "categoryName",
  description: "description",
  responsibleName: "responsibleName",
  amount: "amount",
  recorrencia: "recorrencia",
  statusLabel: "statusLabel",
};

describe("commitImportBatch (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletName: string;
  let responsibleName: string;
  let categoryName: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, responsible, category] = await Promise.all([
      createTestWallet(workspaceId),
      createTestPerson(workspaceId),
      categoryBySlug("DESPESA", "2_habitacao"),
    ]);
    walletName = wallet.name;
    responsibleName = responsible.name;
    categoryName = category.name;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  function row(overrides: Partial<Record<string, string>> = {}) {
    return {
      transactionDate: "10/08/2026",
      dueDate: "10/08/2026",
      walletName,
      nature: "DESPESA",
      categoryName,
      description: "[teste] linha de importação",
      responsibleName,
      amount: "-150,00",
      recorrencia: "1",
      statusLabel: "Pago",
      ...overrides,
    };
  }

  it("importa uma linha válida", async () => {
    const result = await commitImportBatch({
      workspaceId,
      profileId,
      records: [row()],
      mapping: MAPPING,
      filename: "teste.csv",
      skipDuplicates: true,
    });

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);

    const batch = await prisma.importBatch.findUnique({ where: { id: result.batchId }, include: { entries: true } });
    expect(batch?.entries).toHaveLength(1);
    expect(batch?.entries[0].amount.toString()).toBe("-150");
    expect(batch?.entries[0].statusCode).toBe("PAGO");
  });

  it("ignora linha com erro (carteira inexistente) e conta em skipped", async () => {
    const result = await commitImportBatch({
      workspaceId,
      profileId,
      records: [row({ walletName: "carteira que não existe" })],
      mapping: MAPPING,
      filename: "teste.csv",
      skipDuplicates: true,
    });

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it("detecta duplicata dentro do mesmo lote e pula quando skipDuplicates=true", async () => {
    const description = "[teste] duplicata no mesmo lote";
    const result = await commitImportBatch({
      workspaceId,
      profileId,
      records: [row({ description }), row({ description })],
      mapping: MAPPING,
      filename: "teste.csv",
      skipDuplicates: true,
    });

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it("agrupa parcelas com o mesmo groupId quando os números são distintos", async () => {
    const description = "[teste] parcelamento importado";
    const result = await commitImportBatch({
      workspaceId,
      profileId,
      records: [
        row({ description, dueDate: "10/08/2026", recorrencia: "1 de 2", amount: "-50,00" }),
        row({ description, dueDate: "10/09/2026", recorrencia: "2 de 2", amount: "-50,00" }),
      ],
      mapping: MAPPING,
      filename: "teste.csv",
      skipDuplicates: true,
    });

    expect(result.imported).toBe(2);

    const batch = await prisma.importBatch.findUnique({ where: { id: result.batchId }, include: { entries: true } });
    const groupIds = batch!.entries.map((e) => e.groupId);
    expect(groupIds[0]).not.toBeNull();
    expect(groupIds[0]).toBe(groupIds[1]);
    expect(batch!.entries.map((e) => e.installmentNumber).sort()).toEqual([1, 2]);
  });
});
