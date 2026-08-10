import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { createEntryOrSeries } from "@/lib/entries/create";
import {
  categoryBySlug,
  createTestPerson,
  createTestWallet,
  createTestWorkspace,
  cleanupTestWorkspace,
} from "../helpers/fixtures";
import type { CreateEntryInput } from "@/lib/validation/entry";

describe("createEntryOrSeries (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletId: string;
  let responsibleId: string;
  let categoryId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, responsible, category] = await Promise.all([
      createTestWallet(workspaceId),
      createTestPerson(workspaceId),
      categoryBySlug("DESPESA", "2_habitacao"),
    ]);
    walletId = wallet.id;
    responsibleId = responsible.id;
    categoryId = category.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  function baseInput(overrides: Partial<CreateEntryInput> = {}): CreateEntryInput {
    return {
      walletId,
      categoryId,
      responsibleId,
      nature: "DESPESA",
      amount: "-200.50",
      description: "[teste] lançamento",
      transactionDate: "2026-08-10",
      dueDate: "2026-08-10",
      statusCode: "A_PAGAR",
      recurrenceCode: "UNICA",
      ...overrides,
    };
  }

  it("cria um lançamento único", async () => {
    const created = await createEntryOrSeries(workspaceId, profileId, baseInput());

    expect(created).toHaveLength(1);
    expect(created[0].workspaceId).toBe(workspaceId);
    expect(created[0].amount.toString()).toBe("-200.5");
    expect(created[0].groupId).toBeNull();

    const stored = await prisma.entry.findUnique({ where: { id: created[0].id } });
    expect(stored?.description).toBe("[teste] lançamento");
  });

  it("cria uma série parcelada com o mesmo groupId e installmentNumber correto", async () => {
    const created = await createEntryOrSeries(
      workspaceId,
      profileId,
      baseInput({ amount: "-90.00", installmentsTotal: 3, dueDate: "2026-09-05" }),
    );

    expect(created).toHaveLength(3);
    const groupId = created[0].groupId;
    expect(groupId).not.toBeNull();
    expect(created.every((e) => e.groupId === groupId)).toBe(true);
    expect(created.map((e) => e.installmentNumber)).toEqual([1, 2, 3]);
    expect(created.every((e) => e.installmentTotal === 3)).toBe(true);

    const group = await prisma.entryGroup.findUnique({
      where: { id: groupId! },
      include: { entries: true },
    });
    expect(group?.entries).toHaveLength(3);
  });

  it("cria uma série recorrente mensal materializando 25 ocorrências", async () => {
    const created = await createEntryOrSeries(
      workspaceId,
      profileId,
      baseInput({ amount: "-50.00", recurrenceCode: "MENSAL", dueDate: "2026-08-15" }),
    );

    expect(created).toHaveLength(25);
    const groupId = created[0].groupId;
    expect(created.every((e) => e.groupId === groupId)).toBe(true);
    expect(created.every((e) => e.installmentNumber === null)).toBe(true);
  });
});
