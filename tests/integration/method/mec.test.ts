import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { rankByCost, summarize } from "@/lib/method/mec";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

/**
 * Etapa 11 — MEC. O motor puro é coberto em `tests/method/mec.test.ts`; aqui
 * verifica-se o que só o banco responde: a ligação opcional com o parcelamento,
 * o comportamento ao apagar esse parcelamento, e a ida e volta dos `Decimal`.
 */
describe("Debt / MEC (integração)", () => {
  let workspaceId: string;
  let profileId: string;

  beforeAll(async () => {
    const ws = await createTestWorkspace();
    workspaceId = ws.workspaceId;
    profileId = ws.profileId;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("dívida sem parcelamento é registrável — é o caso do cheque especial", async () => {
    // As duas modalidades mais caras normalmente não existem como parcela, e
    // por isso escapariam de qualquer análise baseada só em Entry.
    const d = await prisma.debt.create({
      data: {
        workspaceId,
        creditorName: "Banco do Cheque",
        modality: "Cheque especial",
        outstandingBalance: "3200.00",
      },
    });
    expect(d.entryGroupId).toBeNull();
    expect(d.status).toBe("EM_DIA");
    expect(d.cetAnnualPercent).toBeNull();
  });

  /**
   * `SET NULL`, não `CASCADE`: apagar o parcelamento não pode apagar o registro
   * de crédito — a dívida continua existindo no mundo mesmo sem as parcelas
   * lançadas.
   */
  it("apagar o parcelamento solta o vínculo, mas preserva a dívida", async () => {
    const grupo = await prisma.entryGroup.create({ data: { workspaceId } });
    const d = await prisma.debt.create({
      data: {
        workspaceId,
        entryGroupId: grupo.id,
        creditorName: "Financeira Y",
        modality: "Financiamento de veículo",
        outstandingBalance: "18000.00",
      },
    });

    await prisma.entryGroup.delete({ where: { id: grupo.id } });

    const depois = await prisma.debt.findUniqueOrThrow({ where: { id: d.id } });
    expect(depois.entryGroupId).toBeNull();
    expect(depois.outstandingBalance.toFixed(2)).toBe("18000.00");
  });

  it("os Decimal voltam do banco no formato que o motor ordena", async () => {
    // Ordenação por custo depende de comparar Decimal vindos do Postgres — em
    // memória isso não prova nada sobre o que foi realmente gravado.
    await prisma.debt.create({
      data: {
        workspaceId,
        creditorName: "Banco Caro",
        modality: "Empréstimo pessoal",
        outstandingBalance: "500.00",
        cetAnnualPercent: "180.00",
      },
    });

    const rows = await prisma.debt.findMany({ where: { workspaceId } });
    const ranked = rankByCost(
      rows.map((d) => ({
        id: d.id,
        creditorName: d.creditorName,
        modality: d.modality,
        outstandingBalance: d.outstandingBalance,
        cetAnnualPercent: d.cetAnnualPercent,
        hasNegativacao: d.hasNegativacao,
        hasLegalAction: d.hasLegalAction,
        status: d.status,
      })),
    );

    // As duas tóxicas primeiro (cheque especial por modalidade, Banco Caro por
    // CET de três dígitos); a de financiamento, sem CET, por último.
    expect(ranked[ranked.length - 1].creditorName).toBe("Financeira Y");
    expect(ranked.slice(0, 2).every((d) => d.toxic.isToxic)).toBe(true);

    const s = summarize(ranked);
    // Duas sem CET: o cheque especial e o financiamento — nenhum dos dois teve
    // o custo levantado, que é exatamente o que o mapa cobra do cliente.
    expect(s.semCet).toBe(2);
    expect(s.totalEmAberto.toFixed(2)).toBe("21700.00");
  });

  it("apagar o workspace leva as dívidas junto", async () => {
    const outro = await createTestWorkspace();
    await prisma.debt.create({
      data: {
        workspaceId: outro.workspaceId,
        creditorName: "Z",
        modality: "Outra",
        outstandingBalance: "1.00",
      },
    });

    await cleanupTestWorkspace(outro.workspaceId, outro.profileId);
    expect(await prisma.debt.count({ where: { workspaceId: outro.workspaceId } })).toBe(0);
  });
});
