import { describe, expect, it } from "vitest";
import {
  DELIVERABLES,
  DELIVERABLE_CODES,
  checkCompleteness,
  emptyContentFor,
  nextVersion,
} from "@/lib/method/deliverables/catalog";

describe("catálogo dos artefatos (§12.1)", () => {
  it("tem os dez artefatos codificados", () => {
    expect(DELIVERABLE_CODES).toHaveLength(10);
    expect(DELIVERABLE_CODES).toEqual(["PAN", "AFF", "RAP", "MEC", "MRP", "PLA", "PIP", "MFP", "PCP", "PFI"]);
  });

  it("todo artefato tem propósito e ao menos uma seção", () => {
    for (const code of DELIVERABLE_CODES) {
      const spec = DELIVERABLES[code];
      expect(spec.purpose.length).toBeGreaterThan(0);
      expect(spec.sections.length).toBeGreaterThan(0);
    }
  });

  /**
   * Oito nomes estão confirmados na documentação do projeto; PAN e AFF não.
   * O teste fixa esse estado de propósito — quando as expansões forem
   * confirmadas, ele falha e obriga a atualizar o catálogo em vez de deixar
   * um nome provisório passar despercebido para sempre.
   */
  it("marca explicitamente os dois nomes ainda não confirmados", () => {
    const naoConfirmados = DELIVERABLE_CODES.filter((c) => !DELIVERABLES[c].nameConfirmed);
    expect(naoConfirmados).toEqual(["PAN", "AFF"]);

    for (const code of DELIVERABLE_CODES) {
      if (DELIVERABLES[code].nameConfirmed) {
        // Nome confirmado nunca é só a sigla repetida.
        expect(DELIVERABLES[code].name).not.toBe(code);
      }
    }
  });

  it("cada artefato aponta a fase em que é produzido", () => {
    for (const code of DELIVERABLE_CODES) {
      expect(DELIVERABLES[code].phase).toBeGreaterThanOrEqual(0);
      expect(DELIVERABLES[code].phase).toBeLessThanOrEqual(9);
    }
  });
});

describe("emptyContentFor", () => {
  it("cria o esqueleto com as seções do catálogo, vazias", () => {
    const content = emptyContentFor("MRP");
    expect(content.sections.map((s) => s.title)).toEqual(DELIVERABLES.MRP.sections);
    expect(content.sections.every((s) => s.body === "")).toBe(true);
  });
});

describe("checkCompleteness", () => {
  it("aponta quais seções faltam, não só que está incompleto", () => {
    const content = emptyContentFor("RAP");
    content.sections[0].body = "preenchido";

    const r = checkCompleteness("RAP", content);
    expect(r.isComplete).toBe(false);
    expect(r.missing).toHaveLength(DELIVERABLES.RAP.sections.length - 1);
    expect(r.missing).not.toContain(DELIVERABLES.RAP.sections[0]);
  });

  it("seção só com espaço em branco não conta como preenchida", () => {
    const content = emptyContentFor("PIP");
    content.sections.forEach((s) => (s.body = "   "));
    expect(checkCompleteness("PIP", content).isComplete).toBe(false);
  });

  it("completo quando todas as seções têm conteúdo", () => {
    const content = emptyContentFor("PCP");
    content.sections.forEach((s) => (s.body = "conteúdo"));

    const r = checkCompleteness("PCP", content);
    expect(r.isComplete).toBe(true);
    expect(r.missing).toHaveLength(0);
  });

  it("seção extra não atrapalha nem supre a que falta", () => {
    const content = emptyContentFor("MEC");
    content.sections.forEach((s) => (s.body = "ok"));
    content.sections.push({ title: "Anexo do consultor", body: "livre" });

    expect(checkCompleteness("MEC", content).isComplete).toBe(true);
  });
});

describe("nextVersion", () => {
  /** §12.1 — o PFI da Fase 1 é a v0; o da Fase 2 é a v1. */
  it("o primeiro artefato de um contrato é a versão 0", () => {
    expect(nextVersion([])).toBe(0);
  });

  it("cada validação nova gera a próxima versão", () => {
    expect(nextVersion([0])).toBe(1);
    expect(nextVersion([0, 1, 2])).toBe(3);
  });

  it("não reaproveita número de versão mesmo com buraco na sequência", () => {
    // Versão apagada no meio não pode ser reocupada — o histórico ficaria ambíguo.
    expect(nextVersion([0, 3])).toBe(4);
  });
});
