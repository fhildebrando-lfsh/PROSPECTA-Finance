import { describe, expect, it } from "vitest";
import { dashboardBalanceBlocks, walletBalance } from "@/lib/finance/balance";
import { d, makeEntry } from "./helpers";

describe("walletBalance (§11.1)", () => {
  it("soma só lançamentos liquidados (PAGO/RECEBIDO/ISENTO) da carteira", () => {
    const entries = [
      makeEntry({ walletId: "w1", status: "PAGO", amount: d(-50) }),
      makeEntry({ walletId: "w1", status: "RECEBIDO", amount: d(200) }),
      makeEntry({ walletId: "w1", status: "ISENTO", amount: d(0) }),
      makeEntry({ walletId: "w1", status: "A_PAGAR", amount: d(-999) }), // não liquidado
      makeEntry({ walletId: "w2", status: "PAGO", amount: d(-1000) }), // outra carteira
    ];

    const cutoff = new Date(Date.UTC(2026, 11, 31));
    expect(walletBalance(entries, "w1", cutoff).toNumber()).toBe(150);
  });

  it("ignora lançamentos com due_date depois da data de corte", () => {
    const entries = [
      makeEntry({ walletId: "w1", status: "PAGO", amount: d(-50), dueDate: new Date(Date.UTC(2026, 0, 10)) }),
      makeEntry({ walletId: "w1", status: "PAGO", amount: d(-999), dueDate: new Date(Date.UTC(2026, 5, 1)) }),
    ];

    expect(walletBalance(entries, "w1", new Date(Date.UTC(2026, 0, 31))).toNumber()).toBe(-50);
  });

  it("AQUISICAO e ATUALIZACAO não entram no saldo de carteira (afetam patrimônio, §7.4)", () => {
    const entries = [
      makeEntry({ walletId: "w1", status: "AQUISICAO", amount: d(500000) }),
      makeEntry({ walletId: "w1", status: "ATUALIZACAO", amount: d(1000) }),
    ];

    expect(walletBalance(entries, "w1", new Date(Date.UTC(2026, 11, 31))).toNumber()).toBe(0);
  });
});

describe("dashboardBalanceBlocks (§11.2)", () => {
  it("agrupa saldo em contas / investimentos+caixas / vouchers e soma o total", () => {
    const wallets = [
      { id: "conta-1", kindCode: "CONTA_BANCARIA" },
      { id: "invest-1", kindCode: "CONTA_INVESTIMENTO" },
      { id: "caixa-1", kindCode: "CONTA_CAIXA" },
      { id: "voucher-1", kindCode: "VOUCHER" },
      { id: "cartao-1", kindCode: "CARTAO_CREDITO" }, // fora do total (§11.2)
    ];

    const entries = [
      makeEntry({ walletId: "conta-1", status: "PAGO", amount: d(1000) }),
      makeEntry({ walletId: "invest-1", status: "PAGO", amount: d(500) }),
      makeEntry({ walletId: "caixa-1", status: "PAGO", amount: d(300) }),
      makeEntry({ walletId: "voucher-1", status: "PAGO", amount: d(50) }),
      makeEntry({ walletId: "cartao-1", status: "PAGO", amount: d(-9999) }),
    ];

    const cutoff = new Date(Date.UTC(2026, 11, 31));
    const blocks = dashboardBalanceBlocks(entries, wallets, cutoff);

    expect(blocks.contas.toNumber()).toBe(1000);
    expect(blocks.investimentos.toNumber()).toBe(800);
    expect(blocks.vouchers.toNumber()).toBe(50);
    expect(blocks.total.toNumber()).toBe(1850);
  });
});
