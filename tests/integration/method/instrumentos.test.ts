import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { CATALOG_VERSION } from "@/lib/method/instruments/catalog";
import { validateAnswers } from "@/lib/method/instruments/validation";
import { createTestWorkspace, cleanupTestWorkspace } from "../helpers/fixtures";

/**
 * Etapa 10 (§12) — persistência das respostas dos instrumentos.
 *
 * Os testes unitários cobrem catálogo e validação. Aqui se verifica o que só o
 * banco responde: que rascunho e resposta enviada são distinguíveis, que o C
 * aceita uma resposta por pessoa, e que a versão do catálogo fica gravada junto.
 */
describe("DiagnosticResponse (integração)", () => {
  let workspaceId: string;
  let profileId: string;
  let outroProfileId: string;
  let engagementId: string;

  beforeAll(async () => {
    const ws = await createTestWorkspace();
    workspaceId = ws.workspaceId;
    profileId = ws.profileId;

    const outro = await createTestWorkspace();
    outroProfileId = outro.profileId;
    // O workspace do segundo perfil não é usado; só precisamos de um segundo
    // respondente válido para o caso do C.
    await prisma.workspace.delete({ where: { id: outro.workspaceId } });

    const engagement = await prisma.consultingEngagement.create({
      data: {
        workspaceId,
        modality: "ACOMPANHAMENTO",
        seatType: "individual",
        startsAt: new Date(Date.now() - 86_400_000),
        createdBy: profileId,
      },
    });
    engagementId = engagement.id;
  });

  afterAll(async () => {
    await cleanupTestWorkspace(workspaceId, profileId);
    await prisma.profile.delete({ where: { id: outroProfileId } });
  });

  it("rascunho tem submittedAt nulo; enviado tem data", async () => {
    const rascunho = await prisma.diagnosticResponse.create({
      data: {
        workspaceId,
        engagementId,
        instrument: "A2",
        answers: { fixos_por_categoria: "aluguel 2000" },
        respondedBy: profileId,
      },
    });
    expect(rascunho.submittedAt).toBeNull();
    // Só a ausência de data distingue os dois estados — não há coluna de status
    // à parte, e é isso que impede os dois de discordarem entre si.
    expect(rascunho.catalogVersion).toBe(CATALOG_VERSION);

    const enviado = await prisma.diagnosticResponse.update({
      where: { id: rascunho.id },
      data: { submittedAt: new Date() },
    });
    expect(enviado.submittedAt).not.toBeNull();
  });

  /** §12.6 — "respondido individualmente e sem companhia". */
  it("o C aceita uma resposta por pessoa no mesmo contrato", async () => {
    const dados = (respondedBy: string) => ({
      workspaceId,
      engagementId,
      instrument: "C" as const,
      answers: { tolerancia_perda: "Discordo" },
      respondedBy,
      submittedAt: new Date(),
    });

    await prisma.diagnosticResponse.create({ data: dados(profileId) });
    await prisma.diagnosticResponse.create({ data: dados(outroProfileId) });

    const doC = await prisma.diagnosticResponse.findMany({
      where: { engagementId, instrument: "C" },
    });
    expect(doC).toHaveLength(2);
    expect(new Set(doC.map((r) => r.respondedBy)).size).toBe(2);
  });

  it("o Json volta do banco no formato que a validação entende", async () => {
    // A ida e volta pelo JSONB é onde um formato errado apareceria — validar o
    // objeto em memória não provaria nada sobre o que foi realmente gravado.
    const completo = {
      nome_completo: "Fulano de Tal",
      idade: 40,
      estado_civil: "Casado(a)",
      dependentes: 0,
      ocupacao: "Analista",
      natureza_vinculo: "CLT",
      renda_liquida_nucleo: 12000,
      tem_dividas: false,
      faixa_patrimonio: "Até R$ 100 mil",
      tem_pj_propria: false,
      tres_preocupacoes: "aposentadoria, dívidas, imprevistos",
      consentimento_lgpd: true,
    };

    const criado = await prisma.diagnosticResponse.create({
      data: { workspaceId, engagementId, instrument: "A1", answers: completo, respondedBy: profileId, submittedAt: new Date() },
    });

    const lido = await prisma.diagnosticResponse.findUniqueOrThrow({ where: { id: criado.id } });
    const r = validateAnswers("A1", lido.answers as Record<string, never>);
    expect(r.missing).toEqual([]);
    expect(r.isComplete).toBe(true);
  });

  it("apagar o contrato leva as respostas junto", async () => {
    const engagement = await prisma.consultingEngagement.create({
      data: {
        workspaceId,
        modality: "DIAGNOSTICO",
        seatType: "individual",
        startsAt: new Date(),
        createdBy: profileId,
      },
    });
    await prisma.diagnosticResponse.create({
      data: { workspaceId, engagementId: engagement.id, instrument: "A1", answers: {}, respondedBy: profileId },
    });

    await prisma.consultingEngagement.delete({ where: { id: engagement.id } });

    const sobraram = await prisma.diagnosticResponse.count({ where: { engagementId: engagement.id } });
    expect(sobraram).toBe(0);
  });
});
