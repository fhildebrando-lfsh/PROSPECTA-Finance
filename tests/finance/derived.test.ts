import { describe, expect, it } from "vitest";
import { derivedStatus } from "@/lib/finance/derived";

const today = new Date(Date.UTC(2026, 5, 15)); // 15/jun/2026

describe("derivedStatus (§10 R3)", () => {
  it.each(["PAGO", "RECEBIDO", "ISENTO", "AQUISICAO", "ATUALIZACAO"] as const)(
    "status %s é sempre Ok, mesmo com due_date vencida",
    (status) => {
      expect(derivedStatus({ status, dueDate: new Date(Date.UTC(2020, 0, 1)) }, today)).toBe("Ok");
    },
  );

  it("A_PAGAR com due_date no passado -> vencido há N dias", () => {
    const dueDate = new Date(Date.UTC(2026, 5, 10)); // 5 dias antes de hoje
    expect(derivedStatus({ status: "A_PAGAR", dueDate }, today)).toBe("vencido há 5 dias");
  });

  it("A_RECEBER com due_date no passado -> também vencido (a regra de vencido vem antes)", () => {
    const dueDate = new Date(Date.UTC(2026, 5, 1));
    expect(derivedStatus({ status: "A_RECEBER", dueDate }, today)).toBe("vencido há 14 dias");
  });

  it("A_RECEBER com due_date futura -> a receber em N dias", () => {
    const dueDate = new Date(Date.UTC(2026, 5, 20));
    expect(derivedStatus({ status: "A_RECEBER", dueDate }, today)).toBe("a receber em 5 dias");
  });

  it("A_PAGAR com due_date futura -> a pagar em N dias", () => {
    const dueDate = new Date(Date.UTC(2026, 5, 22));
    expect(derivedStatus({ status: "A_PAGAR", dueDate }, today)).toBe("a pagar em 7 dias");
  });

  it("due_date igual a hoje não é vencido -> a pagar em 0 dias", () => {
    expect(derivedStatus({ status: "A_PAGAR", dueDate: today }, today)).toBe("a pagar em 0 dias");
  });
});
