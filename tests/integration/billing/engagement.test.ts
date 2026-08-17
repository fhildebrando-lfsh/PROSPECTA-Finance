import { afterEach, afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { hasFeature } from "@/lib/billing/entitlements";
import { activeEngagement, closeActiveEngagement, engagementCoversFeature } from "@/lib/billing/engagement";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

/**
 * Etapa 8 — a camada de método. Este é o teste mais sensível do sistema de
 * direitos: até aqui, toda feature `METODO` devolvia `false` para todo mundo
 * (fail-safe). Agora ela é liberada — e **só** por contrato de consultoria
 * ativo. Um erro aqui vaza método para quem pagou só assinatura, que é
 * exatamente o que §3.1 da Metodologia proíbe.
 */
describe("camada de método (integração — Etapa 8, 2026-08-17)", () => {
  let workspaceId: string;
  let profileId: string;

  beforeAll(async () => {
    ({ workspaceId, profileId } = await createTestWorkspace());
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
  });

  afterEach(async () => {
    await prisma.consultingEngagement.deleteMany({ where: { workspaceId } });
  });

  async function criarContrato(data: Partial<Parameters<typeof prisma.consultingEngagement.create>[0]["data"]> = {}) {
    return prisma.consultingEngagement.create({
      data: {
        workspaceId,
        modality: "ACOMPANHAMENTO",
        seatType: "individual",
        startsAt: new Date(Date.now() - 86_400_000),
        createdBy: profileId,
        ...(data as object),
      },
    });
  }

  it("sem contrato, nenhuma feature de método é liberada", async () => {
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
    expect(await hasFeature(workspaceId, "metodo_trilha")).toBe(false);
  });

  it("com contrato ativo, a camada de método abre", async () => {
    await criarContrato();
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(true);
  });

  /**
   * O ponto central de §3.1: dinheiro de assinatura não compra método. O
   * workspace de teste tem LEGACY_INTERNAL, que inclui **todas** as features —
   * e mesmo assim as de método continuam fechadas sem consultor.
   */
  it("assinatura com todas as features não libera método sem consultor", async () => {
    const legacy = await prisma.plan.findUnique({ where: { code: "LEGACY_INTERNAL" } });
    if (legacy) {
      await prisma.subscription.create({
        data: { workspaceId, planId: legacy.id, status: "ACTIVE" },
      });
    }

    try {
      // Feature de PLANO passa pela assinatura...
      expect(await hasFeature(workspaceId, "reserva_inteligente")).toBe(true);
      // ...mas a de MÉTODO não, por mais completa que a assinatura seja.
      expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
    } finally {
      await prisma.subscription.deleteMany({ where: { workspaceId } });
    }
  });

  it("contrato ainda não iniciado não libera", async () => {
    await criarContrato({ startsAt: new Date(Date.now() + 86_400_000) });
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  it("contrato encerrado não libera", async () => {
    await criarContrato({ endsAt: new Date(Date.now() - 3600_000) });
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  it("contrato cancelado não libera, mesmo dentro da vigência", async () => {
    await criarContrato({ status: "CANCELADO" });
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  it("encerrar não apaga — vira histórico", async () => {
    await criarContrato();
    await closeActiveEngagement(workspaceId, "CONCLUIDO");

    expect(await activeEngagement(workspaceId)).toBeNull();
    expect(await prisma.consultingEngagement.count({ where: { workspaceId } })).toBe(1);
    expect(await hasFeature(workspaceId, "mrp_completo")).toBe(false);
  });

  /**
   * A sequência que `openConsultingEngagement` executa ao trocar de contrato:
   * encerra o ativo e abre o novo. Ficou sem cobertura até 2026-08-17 porque
   * não havia tela que a acionasse — a ação existia sem nada chamá-la. Agora
   * que `/admin/usuarios` a expõe, um admin consegue disparar isto, e a
   * invariante precisa estar travada: **nunca dois contratos ATIVO no mesmo
   * workspace**, senão `activeEngagement()` passa a depender de ordem de
   * inserção para decidir o que o cliente pode ver.
   */
  it("trocar de contrato encerra o anterior e deixa exatamente um ativo", async () => {
    await criarContrato({ modality: "DIAGNOSTICO" });

    await closeActiveEngagement(workspaceId, "CONCLUIDO");
    await criarContrato({ modality: "ACOMPANHAMENTO" });

    const ativos = await prisma.consultingEngagement.findMany({ where: { workspaceId, status: "ATIVO" } });
    expect(ativos).toHaveLength(1);
    expect(ativos[0].modality).toBe("ACOMPANHAMENTO");

    // O anterior continua existindo como histórico, não é apagado.
    expect(await prisma.consultingEngagement.count({ where: { workspaceId } })).toBe(2);

    const ativo = await activeEngagement(workspaceId);
    expect(ativo?.modality).toBe("ACOMPANHAMENTO");
  });

  /**
   * §13.8 — um contrato de PROJETO libera só a fase contratada, não a camada
   * inteira. Ampliar escopo por omissão daria de graça o que não foi vendido.
   */
  describe("contrato de projeto limita ao escopo contratado", () => {
    it("libera a feature da fase contratada", async () => {
      const contrato = await criarContrato({ modality: "PROJETO", projectPhase: 3 });
      expect(engagementCoversFeature(contrato, 3)).toBe(true);
    });

    it("não libera feature de outra fase", async () => {
      const contrato = await criarContrato({ modality: "PROJETO", projectPhase: 3 });
      expect(engagementCoversFeature(contrato, 5)).toBe(false);
    });

    /**
     * Esta invariante foi **invertida** em 2026-08-17, e o motivo fica aqui
     * para a inversão não parecer relaxamento de regra.
     *
     * Antes: fase nula não era coberta por Projeto, com a intenção de "escopo
     * de projeto é escopo". Só que **nenhuma** feature tinha fase preenchida em
     * produção, então um contrato de Projeto liberava **zero** features — uma
     * modalidade vendável que não entregava nada, com a tela dizendo "não há
     * consultoria ativa" enquanto havia uma.
     *
     * Agora fase nula significa **transversal**: o andaime da camada de método
     * (trilha, gates, acesso do consultor, entregáveis), sem o qual não dá nem
     * para conduzir o projeto contratado. O que impede isso de virar brecha é a
     * fase de cada feature ser decisão explícita no seed, com o teste de
     * exaustividade logo abaixo.
     */
    it("libera as features transversais, que são o andaime do método", async () => {
      const contrato = await criarContrato({ modality: "PROJETO", projectPhase: 3 });
      expect(engagementCoversFeature(contrato, null)).toBe(true);
    });

    /** Projeto sem fase contratada é contrato malformado — não libera por engano. */
    it("projeto sem fase contratada não libera feature de fase alguma", async () => {
      const contrato = await criarContrato({ modality: "PROJETO", projectPhase: null });
      expect(engagementCoversFeature(contrato, 3)).toBe(false);
    });

    /**
     * A trava que sustenta a inversão acima: toda feature de método precisa ter
     * uma decisão de fase tomada — número ou o `null` explícito de transversal.
     * Feature nova sem decisão apareceria aqui em vez de virar acesso de graça.
     */
    it("toda feature de método tem fase decidida no seed", async () => {
      const metodo = await prisma.feature.findMany({ where: { gateKind: "METODO" }, orderBy: { code: "asc" } });
      expect(metodo.length).toBeGreaterThan(0);

      // Estas são transversais por decisão registrada em prisma/seed-plans.ts.
      const TRANSVERSAIS = new Set([
        "metodo_trilha",
        "metodo_gates",
        "consultor_workspace",
        "agenda_consultoria",
        "entregaveis",
        "psf_nivel_3",
        "psf_revisado",
      ]);

      for (const f of metodo) {
        if (TRANSVERSAIS.has(f.code)) {
          expect(f.methodPhase, `${f.code} deveria ser transversal`).toBeNull();
        } else {
          expect(f.methodPhase, `${f.code} está sem fase — decida em seed-plans.ts`).not.toBeNull();
        }
      }
    });

    it("as demais modalidades liberam a camada inteira", async () => {
      const contrato = await criarContrato({ modality: "ACOMPANHAMENTO" });
      expect(engagementCoversFeature(contrato, null)).toBe(true);
      expect(engagementCoversFeature(contrato, 7)).toBe(true);
    });
  });

  /**
   * A referência solta da Etapa 4 virou FK nesta etapa. Encerrar um contrato
   * não pode apagar as concessões que ele gerou — elas são histórico de acesso.
   */
  it("apagar contrato preserva o PlanGrant, apenas soltando o vínculo", async () => {
    const plano = await prisma.plan.findFirst();
    if (!plano) return;

    const contrato = await criarContrato();
    const grant = await prisma.planGrant.create({
      data: {
        workspaceId,
        planId: plano.id,
        engagementId: contrato.id,
        reason: "[teste] concessão via contrato",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 86_400_000),
        createdBy: profileId,
      },
    });

    try {
      await prisma.consultingEngagement.delete({ where: { id: contrato.id } });
      const depois = await prisma.planGrant.findUnique({ where: { id: grant.id } });
      expect(depois).not.toBeNull();
      expect(depois!.engagementId).toBeNull();
    } finally {
      await prisma.planGrant.deleteMany({ where: { id: grant.id } });
    }
  });
});
