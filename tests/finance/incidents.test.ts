import { describe, expect, it } from "vitest";
import {
  entryIncidents,
  installmentIncidents,
  isAutoReviewIncident,
  isEntryIncident,
  isInstallmentIncident,
} from "@/lib/finance/incidents";

function entry(overrides: Partial<Parameters<typeof isInstallmentIncident>[0]> = {}) {
  return {
    installmentNumber: 1,
    installmentTotal: 2,
    groupId: null,
    incidentAcknowledgedAt: null,
    autoReviewReason: null,
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

describe("isAutoReviewIncident (§18 — importação de OFX sem histórico de categoria)", () => {
  it("é incidente quando autoReviewReason está preenchido", () => {
    expect(isAutoReviewIncident(entry({ installmentTotal: null, autoReviewReason: "sem histórico" }))).toBe(true);
  });

  it("não é incidente quando autoReviewReason é nulo", () => {
    expect(isAutoReviewIncident(entry({ installmentTotal: null, autoReviewReason: null }))).toBe(false);
  });

  it("não é incidente depois de confirmado, mesmo com autoReviewReason preenchido", () => {
    const acked = entry({
      installmentTotal: null,
      autoReviewReason: "sem histórico",
      incidentAcknowledgedAt: new Date(),
    });
    expect(isAutoReviewIncident(acked)).toBe(false);
  });
});

describe("isEntryIncident / entryIncidents (união das duas origens)", () => {
  it("é incidente por parcela órfã OU por revisão automática, sem duplicar critério", () => {
    const orphanInstallment = entry({ installmentTotal: 2, autoReviewReason: null });
    const autoReview = entry({ installmentTotal: null, autoReviewReason: "sem histórico" });
    const both = entry({ installmentTotal: 2, autoReviewReason: "sem histórico" });
    const neither = entry({ installmentTotal: null, autoReviewReason: null, groupId: "g1" });

    expect(isEntryIncident(orphanInstallment)).toBe(true);
    expect(isEntryIncident(autoReview)).toBe(true);
    expect(isEntryIncident(both)).toBe(true);
    expect(isEntryIncident(neither)).toBe(false);

    expect(entryIncidents([orphanInstallment, autoReview, both, neither])).toEqual([
      orphanInstallment,
      autoReview,
      both,
    ]);
  });
});
