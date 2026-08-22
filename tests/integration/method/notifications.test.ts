import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { summarize, visibleTo } from "@/lib/method/notifications";
import { runDueAutomations } from "@/lib/method/run-automations";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

/**
 * Registro Nº 104 — o cron gravava `Notification` e **nenhuma tela lia a
 * tabela**. Estes testes cobrem a ponta que faltava: que o aviso gravado é
 * recuperável, e que o aviso interno não chega ao cliente.
 */
describe("Notification (integração)", () => {
  let workspaceId: string;
  let profileId: string;

  beforeAll(async () => {
    const ws = await createTestWorkspace();
    workspaceId = ws.workspaceId;
    profileId = ws.profileId;
  });

  afterEach(async () => {
    await prisma.notification.deleteMany({ where: { workspaceId } });
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  async function criar(visibility: "SHARED" | "ADVISOR_ONLY", message: string) {
    return prisma.notification.create({
      data: { workspaceId, visibility, severity: "alerta_automacao", message },
    });
  }

  async function lidas() {
    const rows = await prisma.notification.findMany({ where: { workspaceId } });
    return rows.map((n) => ({
      id: n.id,
      visibility: n.visibility,
      severity: n.severity,
      message: n.message,
      createdAt: n.createdAt,
      resolvedAt: n.resolvedAt,
    }));
  }

  /**
   * O teste que fecha o buraco original: o que a rotina grava tem de ser
   * recuperável por uma leitura. Antes disso existir, a linha era criada e
   * ficava inalcançável.
   */
  it("o que a rotina grava é recuperável por leitura", async () => {
    // `INCIDENTE_ACUMULADO` com limiar 0 dispara sempre (`count < threshold`
    // é falso para 0 < 0), então o teste é determinístico e não depende de
    // dado de outro arquivo.
    await prisma.automationRule.create({
      data: {
        workspaceId,
        trigger: "INCIDENTE_ACUMULADO",
        condition: { thresholdCount: 0 },
        createdBy: profileId,
      },
    });

    try {
      await runDueAutomations(new Date());

      const doWorkspace = await lidas();
      expect(doWorkspace.length).toBeGreaterThanOrEqual(1);
      expect(doWorkspace.some((n) => n.message.includes("Incidentes"))).toBe(true);

      // E chega até quem deve ver — é a ponta que não existia.
      const doTitular = visibleTo(doWorkspace, "TITULAR", false);
      expect(doTitular.length).toBeGreaterThanOrEqual(1);
    } finally {
      await prisma.automationRule.deleteMany({ where: { workspaceId } });
    }
  });

  /** A regra de segurança, verificada contra o banco e não só em memória. */
  it("aviso interno não chega ao titular", async () => {
    await criar("SHARED", "aviso do cliente");
    await criar("ADVISOR_ONLY", "leitura interna do consultor");

    const rows = await lidas();

    const doTitular = visibleTo(rows, "TITULAR", false);
    expect(doTitular).toHaveLength(1);
    expect(doTitular[0].message).toBe("aviso do cliente");

    const doConsultor = visibleTo(rows, "ADVISOR", false);
    expect(doConsultor).toHaveLength(2);
  });

  it("resolver marca a data e tira dos pendentes, sem apagar", async () => {
    const n = await criar("SHARED", "para resolver");

    await prisma.notification.updateMany({
      where: { id: n.id, workspaceId, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });

    const s = summarize(await lidas());
    expect(s.pendentes).toHaveLength(0);
    expect(s.resolvidas).toHaveLength(1);
    // O registro continua existindo — vira histórico.
    expect(s.total).toBe(1);
  });

  /**
   * O filtro do `updateMany` é o que impede um id colado à mão de dar baixa
   * num aviso que o cliente nem deveria ver. Esconder na tela não controla
   * acesso.
   */
  it("titular não consegue resolver aviso interno, mesmo sabendo o id", async () => {
    const interno = await criar("ADVISOR_ONLY", "interno");

    const { count } = await prisma.notification.updateMany({
      where: { id: interno.id, workspaceId, resolvedAt: null, visibility: "SHARED" },
      data: { resolvedAt: new Date() },
    });

    expect(count).toBe(0);
    const depois = await prisma.notification.findUniqueOrThrow({ where: { id: interno.id } });
    expect(depois.resolvedAt).toBeNull();
  });

  it("apagar o workspace leva os avisos junto", async () => {
    const outro = await createTestWorkspace();
    await prisma.notification.create({
      data: { workspaceId: outro.workspaceId, visibility: "SHARED", severity: "x", message: "y" },
    });

    await cleanupTestWorkspace(outro.workspaceId, outro.profileId);
    expect(await prisma.notification.count({ where: { workspaceId: outro.workspaceId } })).toBe(0);
  });
});
