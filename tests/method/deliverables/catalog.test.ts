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
   * A versão anterior deste teste fixava PAN e AFF como **não** confirmados —
   * eram os dois cujo nome completo não aparecia em documento versionado do
   * projeto, e o teste existia para falhar quando fossem descobertos, em vez de
   * deixar um nome provisório passar despercebido para sempre.
   *
   * Ele cumpriu o papel: os dois foram encontrados na Metodologia v5.0 em
   * 2026-08-17 (Panorama Financeiro e Acordo Financeiro Familiar), o teste
   * falhou como projetado, e a invariante virou esta — mais forte.
   */
  it("todos os dez nomes estão confirmados e nenhum é a sigla repetida", () => {
    const naoConfirmados = DELIVERABLE_CODES.filter((c) => !DELIVERABLES[c].nameConfirmed);
    expect(naoConfirmados).toEqual([]);

    for (const code of DELIVERABLE_CODES) {
      expect(DELIVERABLES[code].name).not.toBe(code);
      expect(DELIVERABLES[code].name.length).toBeGreaterThan(code.length);
    }
  });

  it("PAN e AFF têm os nomes que a Metodologia v5.0 usa", () => {
    expect(DELIVERABLES.PAN.name).toBe("Panorama Financeiro");
    expect(DELIVERABLES.AFF.name).toBe("Acordo Financeiro Familiar");
    // Ambos nascem na Fase 1 — o PAN é a devolutiva, o AFF é o acordo que a fecha.
    expect(DELIVERABLES.PAN.phase).toBe(1);
    expect(DELIVERABLES.AFF.phase).toBe(1);
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
