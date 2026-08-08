import { describe, expect, it } from "vitest";
import { installmentIncidents, isInstallmentIncident } from "@/lib/finance/incidents";

function entry(overrides: Partial<Parameters<typeof isInstallmentIncident>[0]> = {}) {
  return {
    installmentNumber: 1,
    installmentTotal: 2,
    groupId: null,
    incidentAcknowledgedAt: null,
    ...overrides,
  };
}

describe("isInstallmentIncident", () => {
  it("é incidente quando parcelado (>=2) e sem groupId", () => {
    expect(isInstallmentIncident(entry())).toBe(true);
  });

  it("não é incidente quando já tem groupId (agrupado com sucesso)", () => {
    expect(isInstallmentIncident(entry({ groupId: "g1" }))).toBe(false);
  });

  it("não é incidente quando installmentTotal < 2 (não é parcelamento de verdade)", () => {
    expect(isInstallmentIncident(entry({ installmentTotal: 1 }))).toBe(false);
  });

  it("não é incidente quando installmentTotal é nulo", () => {
    expect(isInstallmentIncident(entry({ installmentTotal: null, installmentNumber: null }))).toBe(false);
  });

  it("não é incidente depois de confirmado (incidentAcknowledgedAt preenchido)", () => {
    expect(isInstallmentIncident(entry({ incidentAcknowledgedAt: new Date() }))).toBe(false);
  });
});

describe("installmentIncidents", () => {
  it("filtra só os que precisam de revisão", () => {
    const entries = [
      entry({ installmentNumber: 1 }),
      entry({ installmentNumber: 2, groupId: "g1" }),
      entry({ installmentNumber: 1, incidentAcknowledgedAt: new Date() }),
      entry({ installmentNumber: 1, installmentTotal: 1 }),
    ];
    const result = installmentIncidents(entries);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(entries[0]);
  });
});
