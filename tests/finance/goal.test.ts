import { describe, expect, it } from "vitest";
import { goalProgress } from "@/lib/finance/goal";
import { d } from "./helpers";

describe("goalProgress (Fase 3, §7.4 — Metas)", () => {
  it("calcula o percentual do saldo em relação ao alvo", () => {
    expect(goalProgress(d(3000), d(6000)).toNumber()).toBe(50);
  });

  it("pode passar de 100% quando o saldo já ultrapassou a meta", () => {
    expect(goalProgress(d(9000), d(6000)).toNumber()).toBe(150);
  });

  it("retorna zero quando o alvo é zero ou negativo, sem dividir por zero", () => {
    expect(goalProgress(d(1000), d(0)).toNumber()).toBe(0);
    expect(goalProgress(d(1000), d(-500)).toNumber()).toBe(0);
  });

  it("saldo zero contra um alvo positivo dá 0%", () => {
    expect(goalProgress(d(0), d(5000)).toNumber()).toBe(0);
  });
});
