import { describe, expect, it } from "vitest";
import {
  classifyDebtTerm,
  debtDeclineTimeline,
  monthlyDebtCommitment,
  openInstallmentGroups,
  totalRemainingDebt,
  type InstallmentEntry,
  type OpenInstallmentGroup,
} from "@/lib/finance/open-installments";
import { d } from "./helpers";

function makeGroup(overrides: Partial<OpenInstallmentGroup> = {}): OpenInstallmentGroup {
  return {
    groupId: "group-1",
    description: "APTO FINANC. CEF",
    walletId: "wallet-1",
    categoryId: "category-1",
    installmentTotal: 12,
    paidCount: 0,
    remainingCount: 12,
    remainingAmount: d(-6000),
    totalAmount: d(-6000),
    nextInstallmentAmount: d(-500),
    nextDueDate: new Date(Date.UTC(2026, 0, 10)),
    lastDueDate: new Date(Date.UTC(2026, 11, 10)),
    ...overrides,
  };
}

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
    expect(groups[0].totalAmount.toNumber()).toBe(-1500);
    expect(groups[0].nextInstallmentAmount?.toNumber()).toBe(-500);
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

describe("totalRemainingDebt / monthlyDebtCommitment (§13 — Dívidas)", () => {
  it("soma a dívida restante e o compromisso mensal (próxima parcela) de todos os grupos", () => {
    const entries: InstallmentEntry[] = [
      // dívida A: 2 parcelas restantes de -300
      makeInstallment({ groupId: "a", installmentNumber: 1, status: "PAGO", amount: d(-300), installmentTotal: 3, dueDate: new Date(Date.UTC(2026, 0, 1)) }),
      makeInstallment({ groupId: "a", installmentNumber: 2, status: "A_PAGAR", amount: d(-300), installmentTotal: 3, dueDate: new Date(Date.UTC(2026, 1, 1)) }),
      makeInstallment({ groupId: "a", installmentNumber: 3, status: "A_PAGAR", amount: d(-300), installmentTotal: 3, dueDate: new Date(Date.UTC(2026, 2, 1)) }),
      // dívida B: 1 parcela restante de -1000
      makeInstallment({ groupId: "b", installmentNumber: 1, status: "A_PAGAR", amount: d(-1000), installmentTotal: 2, dueDate: new Date(Date.UTC(2026, 0, 15)) }),
      makeInstallment({ groupId: "b", installmentNumber: 2, status: "A_PAGAR", amount: d(-1000), installmentTotal: 2, dueDate: new Date(Date.UTC(2026, 1, 15)) }),
    ];

    const groups = openInstallmentGroups(entries);

    expect(totalRemainingDebt(groups).toNumber()).toBe(-2600); // -600 (a) + -2000 (b)
    expect(monthlyDebtCommitment(groups).toNumber()).toBe(-1300); // -300 (próxima de a) + -1000 (próxima de b)
  });

  it("retorna zero para lista vazia", () => {
    expect(totalRemainingDebt([]).toNumber()).toBe(0);
    expect(monthlyDebtCommitment([]).toNumber()).toBe(0);
  });
});

describe("debtDeclineTimeline (§13 — Dívidas, gráfico de diminuição)", () => {
  it("começa no total contratado dos grupos em aberto e desconta cada parcela na sua data", () => {
    const entries: InstallmentEntry[] = [
      makeInstallment({ groupId: "a", installmentNumber: 1, status: "PAGO", amount: d(-500), installmentTotal: 3, dueDate: new Date(Date.UTC(2026, 0, 1)) }),
      makeInstallment({ groupId: "a", installmentNumber: 2, status: "A_PAGAR", amount: d(-500), installmentTotal: 3, dueDate: new Date(Date.UTC(2026, 1, 1)) }),
      makeInstallment({ groupId: "a", installmentNumber: 3, status: "A_PAGAR", amount: d(-500), installmentTotal: 3, dueDate: new Date(Date.UTC(2026, 2, 1)) }),
    ];

    const timeline = debtDeclineTimeline(entries, new Set(["a"]));

    expect(timeline).toHaveLength(3);
    expect(timeline[0].remaining.toNumber()).toBe(1000); // 1500 - 500 (jan)
    expect(timeline[1].remaining.toNumber()).toBe(500); // - 500 (fev)
    expect(timeline[2].remaining.toNumber()).toBe(0); // - 500 (mar) — quita
  });

  it("ignora entries de grupos que não estão na lista de grupos em aberto", () => {
    const entries: InstallmentEntry[] = [
      makeInstallment({ groupId: "aberto", installmentNumber: 1, amount: d(-100), installmentTotal: 2, dueDate: new Date(Date.UTC(2026, 0, 1)) }),
      makeInstallment({ groupId: "quitado", installmentNumber: 1, status: "PAGO", amount: d(-9999), installmentTotal: 2, dueDate: new Date(Date.UTC(2026, 0, 1)) }),
    ];

    const timeline = debtDeclineTimeline(entries, new Set(["aberto"]));
    expect(timeline).toHaveLength(1);
    expect(timeline[0].remaining.toNumber()).toBe(100 - 100); // só o grupo "aberto" conta: total 100, desconta 100
  });

  it("retorna lista vazia sem nenhum grupo em aberto", () => {
    expect(debtDeclineTimeline([], new Set())).toEqual([]);
  });
});

describe("classifyDebtTerm", () => {
  it("classifica como curto prazo quando restam até 12 parcelas", () => {
    const group = makeGroup({ remainingCount: 6 });
    expect(classifyDebtTerm(group)).toBe("curto");
  });

  it("inclui o limite exato de 12 parcelas restantes como curto prazo", () => {
    const group = makeGroup({ remainingCount: 12 });
    expect(classifyDebtTerm(group)).toBe("curto");
  });

  it("classifica como longo prazo quando passa de 12 parcelas restantes", () => {
    const group = makeGroup({ remainingCount: 13 });
    expect(classifyDebtTerm(group)).toBe("longo");
  });

  it("aceita um limiar diferente de 12 parcelas", () => {
    const group = makeGroup({ remainingCount: 3 });
    expect(classifyDebtTerm(group, 2)).toBe("longo");
    expect(classifyDebtTerm(group, 3)).toBe("curto");
  });

  it("caso real reportado: 24x com 23 restantes é longo prazo, não curto — mesmo com lastDueDate distorcida por parcela atrasada", () => {
    const group = makeGroup({ installmentTotal: 24, paidCount: 1, remainingCount: 23, lastDueDate: new Date(Date.UTC(2027, 7, 10)) });
    expect(classifyDebtTerm(group)).toBe("longo");
  });

  it("caso real reportado: 12x com 11 restantes é curto prazo, não longo", () => {
    const group = makeGroup({ installmentTotal: 12, paidCount: 1, remainingCount: 11, lastDueDate: new Date(Date.UTC(2027, 11, 10)) });
    expect(classifyDebtTerm(group)).toBe("curto");
  });
});
