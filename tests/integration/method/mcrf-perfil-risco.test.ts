import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { observeIncomeByPerson } from "@/lib/method/mcrf/income-observation";
import { createTestWorkspace, cleanupTestWorkspace, createTestWallet, createTestPerson, categoryBySlug } from "../helpers/fixtures";

describe("MCRF — perfil de risco e renda observada (integração, Etapa 9-A.1)", () => {
  let workspaceId: string;
  let profileId: string;
  let walletId: string;
  let personId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
    const [wallet, person] = await Promise.all([createTestWallet(workspaceId), createTestPerson(workspaceId)]);
    walletId = wallet.id;
    personId = person.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  it("Person nasce sem perfil de risco — nenhum responsável existente muda de estado", async () => {
    const person = await prisma.person.findUniqueOrThrow({ where: { id: personId } });
    expect(person.regimeTrabalho).toBeNull();
    expect(person.occupation).toBeNull();
    expect(person.segundaAtividadeNivel).toBeNull();
    expect(person.isDependent).toBe(false);
  });

  it("grava e lê o perfil profissional, distinguindo não informado de informado", async () => {
    await prisma.person.update({
      where: { id: personId, workspaceId },
      data: {
        regimeTrabalho: "MILITAR",
        occupation: "Policial militar",
        tenureCurrentMonths: 120,
        experienceTotalMonths: 150,
        segundaAtividadeNivel: "CAPACIDADE_POTENCIAL",
      },
    });

    const person = await prisma.person.findUniqueOrThrow({ where: { id: personId } });
    expect(person.regimeTrabalho).toBe("MILITAR");
    expect(person.tenureCurrentMonths).toBe(120);
    // cargo continua null — campo não preenchido não vira string vazia
    expect(person.cargo).toBeNull();
  });

  it("fonte de renda registra quem paga, para inferir correlação familiar depois", async () => {
    const source = await prisma.incomeSource.create({
      data: {
        workspaceId,
        personId,
        name: "[teste] Soldo",
        kind: "SALARIO",
        employerName: "Polícia Militar",
        isPrincipal: true,
      },
    });

    try {
      const lida = await prisma.incomeSource.findUniqueOrThrow({ where: { id: source.id } });
      expect(lida.employerName).toBe("Polícia Militar");
      expect(lida.isPrincipal).toBe(true);
      // dependência não informada permanece null, nunca false (§8)
      expect(lida.dependeDeEmpregador).toBeNull();
    } finally {
      await prisma.incomeSource.delete({ where: { id: source.id } });
    }
  });

  it("mede a renda a partir dos Entry reais, sem a pessoa declarar valor", async () => {
    const categoria = await categoryBySlug("RECEITA", "salario_liquido");
    const hoje = new Date();

    // 3 meses fechados de 5.000 + um mês com 13º de 15.000.
    const meses = [1, 2, 3, 4];
    const valores = ["5000.00", "5000.00", "5000.00", "15000.00"];
    const criados = await Promise.all(
      meses.map((m, i) => {
        const d = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - m, 10));
        return prisma.entry.create({
          data: {
            workspaceId,
            walletId,
            nature: "RECEITA",
            categoryId: categoria.id,
            responsibleId: personId,
            description: "[teste] salário",
            amount: valores[i],
            transactionDate: d,
            dueDate: d,
            recurrenceCode: "UNICA",
            statusCode: "RECEBIDO",
            createdBy: profileId,
            updatedBy: profileId,
          },
        });
      }),
    );

    try {
      const rows = await prisma.entry.findMany({
        where: { workspaceId, nature: "RECEITA" },
        select: { responsibleId: true, amount: true, dueDate: true, statusCode: true, nature: true },
      });

      const [obs] = observeIncomeByPerson(
        rows.map((e) => ({
          responsibleId: e.responsibleId,
          amount: e.amount,
          dueDate: e.dueDate,
          status: e.statusCode as "RECEBIDO",
          nature: e.nature,
        })),
        [personId],
        hoje,
        4,
      );

      // A mediana ignora o 13º; a média daria 7.500 e superestimaria a renda
      // que continuaria existindo num cenário adverso.
      expect(obs.median.toString()).toBe("5000");
      expect(obs.monthsObserved).toBe(4);
      expect(obs.monthsWithoutIncome).toBe(0);
    } finally {
      await prisma.entry.deleteMany({ where: { id: { in: criados.map((c) => c.id) } } });
    }
  });

  it("excluir a pessoa leva junto as fontes de renda dela", async () => {
    const outra = await createTestPerson(workspaceId);
    const source = await prisma.incomeSource.create({
      data: { workspaceId, personId: outra.id, name: "[teste] fonte", kind: "OUTRO" },
    });

    await prisma.person.delete({ where: { id: outra.id } });

    expect(await prisma.incomeSource.findUnique({ where: { id: source.id } })).toBeNull();
  });
});
