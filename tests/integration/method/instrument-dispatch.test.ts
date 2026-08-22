import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { PARAM_ENVIO_AUTOMATICO, runInstrumentDispatches } from "@/lib/method/instruments/run-dispatches";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

/**
 * Etapa 10-B — a camada impura do envio automático.
 *
 * O motor puro já é coberto em `tests/method/instruments/dispatch-engine.test.ts`.
 * Aqui verifica-se o que só o banco responde — e, sobretudo, **que nada sai com
 * o interruptor desligado**, que é a garantia da qual depende o resto: enquanto
 * ela valer, um erro em qualquer outra parte não vira e-mail para cliente real.
 */
describe("runInstrumentDispatches (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let engagementId: string;

  beforeAll(async () => {
    const ws = await createTestWorkspace();
    workspaceId = ws.workspaceId;
    profileId = ws.profileId;

    const e = await prisma.consultingEngagement.create({
      data: {
        workspaceId,
        modality: "ACOMPANHAMENTO",
        seatType: "individual",
        startsAt: new Date(Date.now() - 86_400_000),
        createdBy: profileId,
      },
    });
    engagementId = e.id;
  });

  afterEach(async () => {
    await prisma.instrumentDispatch.deleteMany({ where: { engagementId } });
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  async function setInterruptor(ligado: boolean) {
    await prisma.methodologyParameter.upsert({
      where: { key: PARAM_ENVIO_AUTOMATICO },
      update: { value: ligado ? 1 : 0 },
      create: {
        key: PARAM_ENVIO_AUTOMATICO,
        value: ligado ? 1 : 0,
        label: "Envio automático dos instrumentos (teste)",
      },
    });
  }

  /**
   * A garantia central. Se este teste cair, qualquer defeito nas demais partes
   * passa a poder chegar na caixa de entrada de um cliente real — por isso ele
   * verifica o efeito no banco, não só o valor devolvido: uma rotina que
   * "devolve ativo: false" mas grava linha teria mandado e-mail antes.
   */
  it("desligado: não avalia nada e não grava nada", async () => {
    await setInterruptor(false);

    const r = await runInstrumentDispatches();

    expect(r.ativo).toBe(false);
    expect(r.enviados).toBe(0);
    expect(r.engagementsAvaliados).toBe(0);
    expect(await prisma.instrumentDispatch.count({ where: { engagementId } })).toBe(0);
  });

  it("desligado não é o mesmo que parâmetro ausente — ambos barram", async () => {
    await prisma.methodologyParameter.deleteMany({ where: { key: PARAM_ENVIO_AUTOMATICO } });

    const r = await runInstrumentDispatches();
    expect(r.ativo).toBe(false);
    expect(await prisma.instrumentDispatch.count({ where: { engagementId } })).toBe(0);

    // Restaura para os demais testes do arquivo.
    await setInterruptor(false);
  });

  /**
   * O UNIQUE (engagement, instrument) é a garantia estrutural de não reenviar.
   * Testado direto no banco porque é dele que a garantia vem — não do código
   * que chama.
   */
  it("o banco recusa dois envios do mesmo instrumento no mesmo contrato", async () => {
    const dados = {
      workspaceId,
      engagementId,
      instrument: "A1" as const,
      dispatchedAt: new Date(),
      dueAt: new Date(Date.now() + 5 * 86_400_000),
    };
    await prisma.instrumentDispatch.create({ data: dados });

    await expect(prisma.instrumentDispatch.create({ data: dados })).rejects.toThrow();
    expect(await prisma.instrumentDispatch.count({ where: { engagementId } })).toBe(1);
  });

  it("apagar o contrato leva os envios junto", async () => {
    const e = await prisma.consultingEngagement.create({
      data: {
        workspaceId,
        modality: "DIAGNOSTICO",
        seatType: "individual",
        startsAt: new Date(),
        createdBy: profileId,
      },
    });
    await prisma.instrumentDispatch.create({
      data: {
        workspaceId,
        engagementId: e.id,
        instrument: "A1",
        dispatchedAt: new Date(),
        dueAt: new Date(),
      },
    });

    await prisma.consultingEngagement.delete({ where: { id: e.id } });
    expect(await prisma.instrumentDispatch.count({ where: { engagementId: e.id } })).toBe(0);
  });
});
