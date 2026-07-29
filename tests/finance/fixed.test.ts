import { describe, expect, it } from "vitest";
import { isFixedExpense } from "@/lib/finance/fixed";

describe("isFixedExpense (§11.7)", () => {
  it.each(["UNICA", "VARIAVEL"] as const)("recurrenceKind %s é variável", (recurrenceKind) => {
    expect(isFixedExpense({ recurrenceKind })).toBe(false);
  });

  it.each(["MENSAL", "ANUAL", "BIMESTRAL", "TRIMESTRAL"] as const)(
    "recurrenceKind %s é fixa (recorrência previsível)",
    (recurrenceKind) => {
      expect(isFixedExpense({ recurrenceKind })).toBe(true);
    },
  );

  it("isFixedOverride=true manda mesmo com recurrenceKind UNICA (o caso do financiamento parcelado)", () => {
    expect(isFixedExpense({ recurrenceKind: "UNICA", isFixedOverride: true })).toBe(true);
  });

  it("isFixedOverride=false manda mesmo com recurrenceKind MENSAL", () => {
    expect(isFixedExpense({ recurrenceKind: "MENSAL", isFixedOverride: false })).toBe(false);
  });

  it("isFixedOverride null ou undefined não interfere na regra automática", () => {
    expect(isFixedExpense({ recurrenceKind: "MENSAL", isFixedOverride: null })).toBe(true);
    expect(isFixedExpense({ recurrenceKind: "UNICA", isFixedOverride: undefined })).toBe(false);
  });
});
