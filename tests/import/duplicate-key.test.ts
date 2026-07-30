import { describe, expect, it } from "vitest";
import { duplicateKey } from "@/lib/import/duplicate-key";
import { d } from "../finance/helpers";

describe("duplicateKey (§18.1 — due_date + amount + description + wallet)", () => {
  it("linhas idênticas geram a mesma chave", () => {
    const a = { dueDate: new Date(Date.UTC(2026, 1, 9)), amount: d(-35), description: "PÃO", walletName: "Itaú" };
    const b = { dueDate: new Date(Date.UTC(2026, 1, 9)), amount: d(-35), description: "pão", walletName: "itaú" };
    expect(duplicateKey(a)).toBe(duplicateKey(b));
  });

  it("qualquer campo diferente muda a chave", () => {
    const base = { dueDate: new Date(Date.UTC(2026, 1, 9)), amount: d(-35), description: "PÃO", walletName: "Itaú" };
    expect(duplicateKey(base)).not.toBe(duplicateKey({ ...base, amount: d(-36) }));
    expect(duplicateKey(base)).not.toBe(duplicateKey({ ...base, walletName: "Nubank" }));
  });
});
