import { describe, expect, it } from "vitest";
import { createTransferPair } from "@/lib/finance/transfer";
import { d } from "./helpers";

describe("createTransferPair (§10 R5)", () => {
  const baseInput = {
    fromWalletId: "nu-conta",
    toWalletId: "nu-cx-viagem",
    amount: d(500),
    transferId: "transfer-1",
    categoryId: "categoria-transferencias",
    transactionDate: new Date(Date.UTC(2026, 0, 1)),
    dueDate: new Date(Date.UTC(2026, 0, 1)),
  };

  it("gera duas linhas cuja soma é sempre zero", () => {
    const [outLine, inLine] = createTransferPair(baseInput);
    expect(outLine.amount.plus(inLine.amount).toNumber()).toBe(0);
    expect(outLine.amount.toNumber()).toBe(-500);
    expect(inLine.amount.toNumber()).toBe(500);
  });

  it("as duas linhas têm nature OUTRO e o mesmo transferId", () => {
    const [outLine, inLine] = createTransferPair(baseInput);
    expect(outLine.nature).toBe("OUTRO");
    expect(inLine.nature).toBe("OUTRO");
    expect(outLine.transferId).toBe(inLine.transferId);
  });

  it("linha de saída aponta para a origem, linha de entrada para o destino", () => {
    const [outLine, inLine] = createTransferPair(baseInput);
    expect(outLine.walletId).toBe("nu-conta");
    expect(inLine.walletId).toBe("nu-cx-viagem");
  });

  it("rejeita valor zero ou negativo", () => {
    expect(() => createTransferPair({ ...baseInput, amount: d(0) })).toThrow();
    expect(() => createTransferPair({ ...baseInput, amount: d(-10) })).toThrow();
  });
});
