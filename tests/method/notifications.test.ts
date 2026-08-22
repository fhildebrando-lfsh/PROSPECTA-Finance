import { describe, expect, it } from "vitest";
import {
  podeVerInternos,
  severityStyle,
  summarize,
  visibleTo,
  type NotificationRow,
} from "@/lib/method/notifications";

const T0 = new Date(Date.UTC(2026, 7, 1));

function nota(over: Partial<NotificationRow> = {}): NotificationRow {
  return {
    id: "n1",
    visibility: "SHARED",
    severity: "alerta_automacao",
    message: "Você passou do limite em Alimentação.",
    createdAt: T0,
    resolvedAt: null,
    ...over,
  };
}

describe("visibilidade (regra de segurança)", () => {
  it("consultor e admin veem os avisos internos", () => {
    expect(podeVerInternos("ADVISOR", false)).toBe(true);
    expect(podeVerInternos("TITULAR", true)).toBe(true);
  });

  /**
   * O ponto que esta função existe para garantir: `ADVISOR_ONLY` é a leitura
   * profissional sobre o caso do cliente. Vazá-la mostraria a ele algo que
   * ninguém escolheu compartilhar.
   */
  it("titular, membro e leitura NÃO veem os internos", () => {
    for (const role of ["TITULAR", "MEMBRO", "LEITURA"] as const) {
      expect(podeVerInternos(role, false), role).toBe(false);
    }
    expect(podeVerInternos(null, false)).toBe(false);
  });

  it("o filtro remove os internos de quem não pode vê-los", () => {
    const lista = [nota({ id: "a" }), nota({ id: "b", visibility: "ADVISOR_ONLY" })];

    expect(visibleTo(lista, "TITULAR", false).map((n) => n.id)).toEqual(["a"]);
    expect(visibleTo(lista, "ADVISOR", false).map((n) => n.id)).toEqual(["a", "b"]);
    expect(visibleTo(lista, "TITULAR", true).map((n) => n.id)).toEqual(["a", "b"]);
  });

  it("lista vazia não quebra", () => {
    expect(visibleTo([], "TITULAR", false)).toEqual([]);
  });
});

describe("severityStyle", () => {
  it("conhece as severidades que o sistema produz", () => {
    expect(severityStyle("alerta_automacao").label).toBe("Automação");
    expect(severityStyle("alerta_automacao").tone).toBe("atencao");
  });

  /**
   * Severidade desconhecida cai num rótulo neutro em vez de sumir: um aviso que
   * o sistema não sabe classificar ainda é um aviso, e engoli-lo repetiria em
   * escala menor o defeito que esta tela corrige.
   */
  it("severidade desconhecida vira aviso neutro, nunca desaparece", () => {
    const s = severityStyle("algo_que_ninguem_previu");
    expect(s.label).toBe("Aviso");
    expect(s.tone).toBe("info");
  });
});

describe("summarize", () => {
  it("separa pendentes de resolvidas", () => {
    const lista = [nota({ id: "aberta" }), nota({ id: "fechada", resolvedAt: T0 })];
    const s = summarize(lista);

    expect(s.pendentes.map((n) => n.id)).toEqual(["aberta"]);
    expect(s.resolvidas.map((n) => n.id)).toEqual(["fechada"]);
    expect(s.total).toBe(2);
  });

  it("ordena da mais recente para a mais antiga", () => {
    const antiga = nota({ id: "antiga", createdAt: T0 });
    const nova = nota({ id: "nova", createdAt: new Date(Date.UTC(2026, 7, 10)) });

    expect(summarize([antiga, nova]).pendentes.map((n) => n.id)).toEqual(["nova", "antiga"]);
  });

  /** Resolvida vira histórico — apagar deixaria a tela sem memória. */
  it("resolvida continua na lista, como histórico", () => {
    const s = summarize([nota({ resolvedAt: T0 })]);
    expect(s.total).toBe(1);
    expect(s.resolvidas).toHaveLength(1);
  });

  it("conta quantos avisos são internos", () => {
    const s = summarize([nota(), nota({ id: "x", visibility: "ADVISOR_ONLY" })]);
    expect(s.internos).toBe(1);
  });

  it("lista vazia devolve tudo zerado", () => {
    const s = summarize([]);
    expect(s).toEqual({ pendentes: [], resolvidas: [], total: 0, internos: 0 });
  });
});
