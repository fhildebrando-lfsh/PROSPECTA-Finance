import { describe, expect, it } from "vitest";
import { openInstallmentGroups, type InstallmentEntry } from "@/lib/finance/open-installments";
import { d } from "./helpers";

function makeInstallment(overrides: Partial<InstallmentEntry> = {}): InstallmentEntry {
  return {
    id: `inst-${Math.random()}`,
    groupId: "group-1",
    walletId: "wallet-1",
    categoryId: "category-1",
    description: "APTO FINANC. CEF",
    amount: d(-500),
    dueDate: new Date(Date.UTC(2026, 0, 10)),
    status: "A_PAGAR",
    installmentNumber: 1,
    installmentTotal: 3,
    ...overrides,
  };
}

describe("openInstallmentGroups (§13 — Despesas parceladas)", () => {
  it("agrupa por groupId e resume o que falta", () => {
    const entries: InstallmentEntry[] = [
      makeInstallment({ installmentNumber: 1, status: "PAGO", amount: d(-500), dueDate: new Date(Date.UTC(2026, 0, 10)) }),
      makeInstallment({ installmentNumber: 2, status: "A_PAGAR", amount: d(-500), dueDate: new Date(Date.UTC(2026, 1, 10)) }),
      makeInstallment({ installmentNumber: 3, status: "A_PAGAR", amount: d(-500), dueDate: new Date(Date.UTC(2026, 2, 10)) }),
    ];

    const groups = openInstallmentGroups(entries);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe("group-1");
    expect(groups[0].installmentTotal).toBe(3);
    expect(groups[0].paidCount).toBe(1);
    expect(groups[0].remainingCount).toBe(2);
    expect(groups[0].remainingAmount.toNumber()).toBe(-1000);
    expect(groups[0].nextDueDate?.toISOString().slice(0, 10)).toBe("2026-02-10");
    expect(groups[0].lastDueDate.toISOString().slice(0, 10)).toBe("2026-03-10");
  });

  it("omite grupo já totalmente liquidado", () => {
    const entries: InstallmentEntry[] = [
      makeInstallment({ installmentNumber: 1, status: "PAGO" }),
      makeInstallment({ installmentNumber: 2, status: "PAGO" }),
    ];
    expect(openInstallmentGroups(entries)).toEqual([]);
  });

  it("ignora entries sem groupId ou sem parcelamento de verdade (installmentTotal < 2 ou ausente — ex.: recorrência MENSAL sem fim)", () => {
    const entries: InstallmentEntry[] = [
      makeInstallment({ groupId: null }),
      makeInstallment({ groupId: "group-mensal", installmentTotal: null, installmentNumber: null }),
      makeInstallment({ groupId: "group-avulso", installmentTotal: 1, installmentNumber: 1 }),
    ];
    expect(openInstallmentGroups(entries)).toEqual([]);
  });

  it("ordena os grupos pela próxima parcela mais próxima", () => {
    const entries: InstallmentEntry[] = [
      makeInstallment({ groupId: "longe", installmentNumber: 1, status: "A_PAGAR", dueDate: new Date(Date.UTC(2027, 0, 1)), installmentTotal: 2 }),
      makeInstallment({ groupId: "longe", installmentNumber: 2, status: "A_PAGAR", dueDate: new Date(Date.UTC(2027, 1, 1)), installmentTotal: 2 }),
      makeInstallment({ groupId: "perto", installmentNumber: 1, status: "A_PAGAR", dueDate: new Date(Date.UTC(2026, 0, 1)), installmentTotal: 2 }),
      makeInstallment({ groupId: "perto", installmentNumber: 2, status: "A_PAGAR", dueDate: new Date(Date.UTC(2026, 1, 1)), installmentTotal: 2 }),
    ];

    const groups = openInstallmentGroups(entries);
    expect(groups.map((g) => g.groupId)).toEqual(["perto", "longe"]);
  });
});
