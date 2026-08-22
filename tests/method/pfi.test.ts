import { describe, expect, it } from "vitest";
import { PSF_INDICADORES, compararPsf, compilePfi, type DeliverableSnapshot } from "@/lib/method/pfi";
import { DELIVERABLES } from "@/lib/method/deliverables/catalog";

const HOJE = new Date(Date.UTC(2026, 7, 18));
const BASE = new Date(Date.UTC(2026, 1, 1));

function snap(over: Partial<DeliverableSnapshot> = {}): DeliverableSnapshot {
  return {
    code: "PAN",
    version: 0,
    status: "VALIDADO",
    createdAt: BASE,
    validatedAt: BASE,
    ...over,
  };
}

function entrada(over: Partial<Parameters<typeof compilePfi>[0]> = {}) {
  return {
    deliverables: [] as DeliverableSnapshot[],
    baseSnapshotDate: null,
    baseIndicators: {},
    atualSnapshotDate: null,
    atualIndicators: {},
    pfiAnterior: null,
    hoje: HOJE,
    ...over,
  };
}

describe("compararPsf (§8.1)", () => {
  it("cobre os sete indicadores, na ordem de §8.3", () => {
    expect(PSF_INDICADORES.map((i) => i.key)).toEqual([
      "organizacao",
      "endividamento",
      "liquidez",
      "protecao",
      "construcao",
      "longevidade",
      "continuidade",
    ]);
  });

  it("mede a subida entre a linha de base e hoje", () => {
    const r = compararPsf(
      { liquidez: { faixa: "fragil", valor: 30 } },
      { liquidez: { faixa: "saudavel", valor: 70 } },
    );
    const liquidez = r.find((x) => x.key === "liquidez")!;
    expect(liquidez.evolucao).toEqual({ mudanca: "subiu", degraus: 2 });
  });

  /**
   * O ponto que protege a honestidade do documento: um indicador que passou a
   * ser avaliado no meio do caminho **não subiu** — ele passou a existir.
   * Tratar como progresso inflaria o resultado do trabalho, num documento cuja
   * função é justificar honorário.
   */
  it("indicador que não existia na linha de base não conta como progresso", () => {
    const r = compararPsf({}, { longevidade: { faixa: "saudavel", valor: 70 } });
    expect(r.find((x) => x.key === "longevidade")!.evolucao).toBeNull();
  });

  it("queda é registrada como queda", () => {
    const r = compararPsf(
      { endividamento: { faixa: "saudavel", valor: 70 } },
      { endividamento: { faixa: "critico", valor: 10 } },
    );
    expect(r.find((x) => x.key === "endividamento")!.evolucao).toEqual({ mudanca: "desceu", degraus: 3 });
  });
});

describe("compilePfi — panorama", () => {
  it("lista todos os artefatos, inclusive os que faltam", () => {
    const r = compilePfi(entrada({ deliverables: [snap({ code: "PAN", version: 2 })] }));
    const panorama = r.content.sections[0].body;

    expect(panorama).toContain("PAN");
    expect(panorama).toContain("v2");
    expect(panorama).toContain("MRP"); // ainda não produzido, mas listado
    expect(r.faltando).toContain("MRP");
  });

  /** Um documento que se lista dentro de si mesmo confunde mais do que informa. */
  it("o próprio PFI não entra no inventário", () => {
    const r = compilePfi(entrada({ deliverables: [snap({ code: "PFI", version: 1 })] }));
    expect(r.faltando).not.toContain("PFI");
    expect(r.content.sections[0].body).not.toContain("— Plano Financeiro Integrado:");
  });

  it("distingue rascunho de entrega validada", () => {
    const r = compilePfi(
      entrada({ deliverables: [snap({ code: "MRP", status: "RASCUNHO", validatedAt: null })] }),
    );
    expect(r.content.sections[0].body).toContain("rascunho");
    expect(r.avisos.join(" ")).toContain("em rascunho");
  });

  it("as seções são exatamente as do catálogo", () => {
    const r = compilePfi(entrada());
    expect(r.content.sections.map((s) => s.title)).toEqual(DELIVERABLES.PFI.sections);
  });
});

describe("compilePfi — comparativo do PSF", () => {
  it("sem duas fotos, avisa em vez de inventar comparação", () => {
    const r = compilePfi(entrada());
    expect(r.content.sections[0].body).toContain("Ainda não há duas fotos");
    expect(r.avisos.join(" ")).toContain("coração do PFI");
  });

  it("uma foto só não vira evolução", () => {
    const r = compilePfi(
      entrada({ baseSnapshotDate: BASE, atualSnapshotDate: BASE, baseIndicators: {}, atualIndicators: {} }),
    );
    expect(r.content.sections[0].body).toContain("não há intervalo a comparar");
  });

  it("com duas fotos, narra o que subiu e o que ficou igual", () => {
    const r = compilePfi(
      entrada({
        baseSnapshotDate: BASE,
        atualSnapshotDate: HOJE,
        baseIndicators: { liquidez: { faixa: "critico" }, organizacao: { faixa: "saudavel" } },
        atualIndicators: { liquidez: { faixa: "saudavel" }, organizacao: { faixa: "saudavel" } },
      }),
    );
    const corpo = r.content.sections[0].body;
    expect(corpo).toContain("Liquidez: subiu 3 níveis");
    expect(corpo).toContain("Organização: manteve-se");
    expect(corpo).toContain("1 indicador(es) mudaram de nível");
  });
});

describe("compilePfi — o que mudou desde a última versão", () => {
  it("a primeira versão diz que é a primeira", () => {
    const r = compilePfi(entrada());
    expect(r.content.sections[1].body).toContain("primeira versão");
  });

  it("aponta artefato novo e artefato revisto", () => {
    const r = compilePfi(
      entrada({
        deliverables: [snap({ code: "PAN", version: 1 }), snap({ code: "MEC", version: 0 })],
        pfiAnterior: { version: 0, deliverables: [snap({ code: "PAN", version: 0 })] },
      }),
    );
    const corpo = r.content.sections[1].body;
    expect(corpo).toContain("PAN foi revisto: v0 → v1");
    expect(corpo).toContain("MEC passou a existir");
  });

  it("nada mudou é dito explicitamente", () => {
    const anterior = [snap({ code: "PAN", version: 1 })];
    const r = compilePfi(entrada({ deliverables: anterior, pfiAnterior: { version: 0, deliverables: anterior } }));
    expect(r.content.sections[1].body).toContain("Nenhum artefato mudou");
  });
});

describe("compilePfi — o que o compilador não faz", () => {
  /**
   * Prioridade e compromisso são juízo do consultor sobre o cliente. Texto
   * gerado aqui teria a aparência de conselho sem ninguém tê-lo dado.
   */
  it("deixa Prioridades e Compromissos em branco, e avisa que é de propósito", () => {
    const r = compilePfi(entrada({ deliverables: [snap()] }));
    const porTitulo = new Map(r.content.sections.map((s) => [s.title, s.body]));

    expect(porTitulo.get("Prioridades")).toBe("");
    expect(porTitulo.get("Compromissos")).toBe("");
    expect(r.avisos.join(" ")).toContain("juízo do consultor");
  });
});
