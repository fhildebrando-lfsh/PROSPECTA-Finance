import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Decimal } from "@/lib/finance/types";
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

  /**
   * §43 — o simulador. As hipóteses entram depois do dado real e antes dos
   * cenários, então tudo a jusante recalcula coerentemente. Nada é gravado.
   */
  describe('simulador "E se?"', () => {
    // O teste anterior deixa o regime como MILITAR. Fixar aqui torna este bloco
    // independente da ordem de execução, em vez de herdar estado do vizinho.
    beforeAll(async () => {
      await prisma.person.update({ where: { id: personId }, data: { regimeTrabalho: "CLT" } });
    });

    it("reduzir o custo mensal reduz a reserva recomendada", async () => {
      const real = await runAssessment(workspaceId, REF);
      const simulado = await runAssessment(workspaceId, REF, { reducaoCustoPct: 0.2 });

      expect(simulado.cema.lessThan(real.cema)).toBe(true);
      expect(simulado.reserveTarget.lessThan(real.reserveTarget)).toBe(true);
    });

    it("renda extra do cônjuge reduz a necessidade", async () => {
      const real = await runAssessment(workspaceId, REF);
      const simulado = await runAssessment(workspaceId, REF, { rendaExtraMensal: new Decimal(4000) });
      expect(simulado.reserveTarget.lessThanOrEqualTo(real.reserveTarget)).toBe(true);
    });

    it("desenvolver segunda atividade encurta a recuperação e reduz a reserva", async () => {
      const real = await runAssessment(workspaceId, REF);
      const simulado = await runAssessment(workspaceId, REF, { forcarSegundaAtividadeResiliente: true });
      expect(simulado.reserveTarget.lessThanOrEqualTo(real.reserveTarget)).toBe(true);
    });

    it("aumentar liquidez soma à reserva elegível sem mexer na meta", async () => {
      const real = await runAssessment(workspaceId, REF);
      const simulado = await runAssessment(workspaceId, REF, { liquidezExtra: new Decimal(10000) });

      expect(simulado.eligibleReserve.minus(real.eligibleReserve).toString()).toBe("10000");
      // A meta não muda: mais dinheiro guardado não altera o risco que se corre.
      expect(simulado.reserveTarget.toString()).toBe(real.reserveTarget.toString());
      expect(simulado.progressoPct).toBeGreaterThanOrEqual(real.progressoPct);
      expect(simulado.progressoPct).toBeLessThanOrEqual(100); // progresso é capado
    });

    it("simular não grava nada — o cálculo real continua igual", async () => {
      const antes = await runAssessment(workspaceId, REF);
      await runAssessment(workspaceId, REF, { reducaoCustoPct: 0.5, liquidezExtra: new Decimal(99999) });
      const depois = await runAssessment(workspaceId, REF);

      expect(depois.reserveTarget.toString()).toBe(antes.reserveTarget.toString());
      expect(depois.eligibleReserve.toString()).toBe(antes.eligibleReserve.toString());
    });
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
