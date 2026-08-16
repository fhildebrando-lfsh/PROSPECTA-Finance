import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { runAssessment } from "@/lib/method/mcrf/run-assessment";
import {
  createTestWorkspace,
  cleanupTestWorkspace,
  createTestWallet,
  createTestPerson,
  categoryBySlug,
} from "../helpers/fixtures";

/**
 * Integração da camada impura do MCRF (Etapa 9-A.5). Os sete motores já têm
 * testes puros; o que se prova aqui é a **composição** — foi exatamente onde
 * morava a dupla contagem da Etapa 7, e a lição virou regra.
 */
describe("runAssessment (integração — Etapa 9-A.5, 2026-08-16)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletId: string;
  let personId: string;

  const REF = new Date(Date.UTC(2026, 6, 15)); // meses fechados: jun para trás

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, person] = await Promise.all([createTestWallet(workspaceId), createTestPerson(workspaceId)]);
    walletId = wallet.id;
    personId = person.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  async function lancar(opts: {
    nature: "RECEITA" | "DESPESA";
    categorySlug: string;
    subcategorySlug?: string;
    amount: string;
    monthsAgo: number;
  }) {
    const categoria = await categoryBySlug(opts.nature, opts.categorySlug);
    const subcategoria = opts.subcategorySlug
      ? await prisma.subcategory.findFirst({
          where: { slug: opts.subcategorySlug, workspaceId: null, categoryId: categoria.id },
        })
      : null;
    const date = new Date(Date.UTC(2026, 6 - opts.monthsAgo, 10));

    return prisma.entry.create({
      data: {
        workspaceId,
        walletId,
        nature: opts.nature,
        categoryId: categoria.id,
        subcategoryId: subcategoria?.id ?? null,
        responsibleId: personId,
        description: "[teste] mcrf",
        amount: opts.amount,
        transactionDate: date,
        dueDate: date,
        recurrenceCode: "MENSAL",
        statusCode: opts.nature === "RECEITA" ? "RECEBIDO" : "PAGO",
        createdBy: profileId,
        updatedBy: profileId,
      },
    });
  }

  it("calcula a partir do dado real, sem estimativa inventada", async () => {
    for (let m = 1; m <= 6; m++) {
      await lancar({ nature: "RECEITA", categorySlug: "salario_liquido", amount: "8000.00", monthsAgo: m });
      // Aluguel é RIGIDA no seed de rigidez; supermercado é AJUSTAVEL.
      await lancar({
        nature: "DESPESA",
        categorySlug: "2_habitacao",
        subcategorySlug: "aluguel",
        amount: "-2000.00",
        monthsAgo: m,
      });
      await lancar({
        nature: "DESPESA",
        categorySlug: "1_alimentacao",
        subcategorySlug: "supermercado",
        amount: "-1000.00",
        monthsAgo: m,
      });
    }

    const a = await runAssessment(workspaceId, REF);

    expect(a.methodologyVersion).toBe("PROSPECTA-MCRF-1.0");
    expect(a.cema.toString()).toBe("3000"); // 2000 rígida + 1000 ajustável
    // CCM comprime só a ajustável: 2000 + 1000×70% = 2700
    expect(a.ccm.toString()).toBe("2700");
    expect(a.ccm.lessThan(a.cema)).toBe(true);
  });

  it("produz os 10 cenários e uma recomendação positiva", async () => {
    const a = await runAssessment(workspaceId, REF);
    expect(a.scenarios).toHaveLength(10);
    expect(a.reserveTarget.greaterThan(0)).toBe(true);
    expect(a.cenarioDeterminante).not.toBeNull();
  });

  it("os três níveis de proteção são crescentes", async () => {
    const a = await runAssessment(workspaceId, REF);
    expect(a.protecaoEssencial.lessThanOrEqualTo(a.reserveTarget)).toBe(true);
    expect(a.reserveTarget.lessThan(a.protecaoReforcada)).toBe(true);
  });

  /**
   * **O teste que a análise chamou de indispensável.** Se dois perfis com o
   * mesmo custo essencial recebessem a mesma reserva, a metodologia teria
   * degenerado exatamente para o que ela existe para substituir — despesa
   * multiplicada por um número fixo de meses.
   *
   * Aqui a única diferença é o regime de trabalho: um militar tem renda
   * estável (interrupção não é material) e o CLT não. Mesmo CEMA, riscos
   * diferentes, reservas diferentes.
   */
  it("mesma despesa e riscos diferentes produzem reservas diferentes", async () => {
    await prisma.person.update({ where: { id: personId }, data: { regimeTrabalho: "CLT" } });
    const comoClt = await runAssessment(workspaceId, REF);

    await prisma.person.update({ where: { id: personId }, data: { regimeTrabalho: "MILITAR" } });
    const comoMilitar = await runAssessment(workspaceId, REF);

    expect(comoClt.cema.toString()).toBe(comoMilitar.cema.toString());
    expect(comoClt.reserveTarget.equals(comoMilitar.reserveTarget)).toBe(false);
    // O militar não tem o cenário de interrupção como material (§23).
    expect(comoMilitar.scenarios.find((s) => s.id === "B")!.isMaterial).toBe(false);
    expect(comoClt.scenarios.find((s) => s.id === "B")!.isMaterial).toBe(true);
  });

  it("aponta lacunas do perfil em vez de fingir precisão", async () => {
    const a = await runAssessment(workspaceId, REF);
    expect(a.gaps.length).toBeGreaterThan(0);
    expect(a.dataConfidence).toBeDefined();
  });

  it("workspace sem lançamento nenhum não quebra — devolve zero", async () => {
    const vazio = await createTestWorkspace();
    try {
      const a = await runAssessment(vazio.workspaceId, REF);
      expect(a.cema.toString()).toBe("0");
      expect(a.eligibleReserve.toString()).toBe("0");
    } finally {
      await cleanupTestWorkspace(vazio.workspaceId, vazio.profileId);
    }
  });
});
