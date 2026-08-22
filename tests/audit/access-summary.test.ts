import { describe, expect, it } from "vitest";
import {
  JANELA_SESSAO_MIN,
  actionLabel,
  agruparSessoes,
  eventosRelevantes,
  summarizeAccess,
  type AccessLogRow,
} from "@/lib/audit/access-summary";

const T0 = new Date(Date.UTC(2026, 7, 18, 10, 0));

function min(n: number): Date {
  return new Date(T0.getTime() + n * 60_000);
}

let seq = 0;
function log(over: Partial<AccessLogRow> = {}): AccessLogRow {
  seq += 1;
  return {
    id: `l${seq}`,
    actorProfileId: "consultor-a",
    actorRole: "ADVISOR",
    action: "VIEW_WORKSPACE",
    occurredAt: T0,
    ...over,
  };
}

describe("actionLabel", () => {
  it("traduz as ações conhecidas", () => {
    expect(actionLabel("VIEW_WORKSPACE")).toBe("Acessou o workspace");
    expect(actionLabel("GRANT_ADVISOR_WRITE")).toContain("permissão de edição");
  });

  /** Ação desconhecida não some — vira o próprio código, que é rastreável. */
  it("ação desconhecida aparece como o código, nunca em branco", () => {
    expect(actionLabel("ALGO_NOVO")).toBe("ALGO_NOVO");
  });
});

describe("agruparSessoes", () => {
  it("junta visualizações contíguas do mesmo ator numa sessão", () => {
    const s = agruparSessoes([
      log({ occurredAt: min(0) }),
      log({ occurredAt: min(5) }),
      log({ occurredAt: min(12) }),
    ]);

    expect(s).toHaveLength(1);
    expect(s[0].visualizacoes).toBe(3);
    expect(s[0].inicio).toEqual(min(0));
    expect(s[0].fim).toEqual(min(12));
  });

  it("silêncio maior que a janela abre sessão nova", () => {
    const s = agruparSessoes([log({ occurredAt: min(0) }), log({ occurredAt: min(JANELA_SESSAO_MIN + 1) })]);
    expect(s).toHaveLength(2);
  });

  /** A borda pertence à sessão anterior: exatamente 30 min ainda é contíguo. */
  it("exatamente na janela ainda é a mesma sessão", () => {
    const s = agruparSessoes([log({ occurredAt: min(0) }), log({ occurredAt: min(JANELA_SESSAO_MIN) })]);
    expect(s).toHaveLength(1);
  });

  it("atores diferentes nunca se misturam, mesmo no mesmo minuto", () => {
    const s = agruparSessoes([
      log({ actorProfileId: "a", occurredAt: min(0) }),
      log({ actorProfileId: "b", occurredAt: min(1) }),
    ]);
    expect(s).toHaveLength(2);
    expect(new Set(s.map((x) => x.actorProfileId)).size).toBe(2);
  });

  it("a mais recente vem primeiro", () => {
    const s = agruparSessoes([
      log({ occurredAt: min(0) }),
      log({ occurredAt: min(200) }),
    ]);
    expect(s[0].fim).toEqual(min(200));
  });

  /**
   * O ponto que protege a auditoria: conceder e revogar escrita são atos
   * deliberados. Dissolvê-los numa sessão apagaria justamente o que mais
   * importa auditar.
   */
  it("conceder e revogar não entram nas sessões", () => {
    const s = agruparSessoes([
      log({ occurredAt: min(0) }),
      log({ action: "GRANT_ADVISOR_WRITE", occurredAt: min(1) }),
    ]);
    expect(s).toHaveLength(1);
    expect(s[0].visualizacoes).toBe(1);
  });

  it("lista vazia devolve nenhuma sessão", () => {
    expect(agruparSessoes([])).toEqual([]);
  });
});

describe("eventosRelevantes", () => {
  it("traz só os atos deliberados, do mais recente ao mais antigo", () => {
    const e = eventosRelevantes([
      log({ occurredAt: min(0) }),
      log({ id: "g", action: "GRANT_ADVISOR_WRITE", occurredAt: min(10) }),
      log({ id: "r", action: "REVOKE_ADVISOR_WRITE", occurredAt: min(50) }),
    ]);
    expect(e.map((x) => x.id)).toEqual(["r", "g"]);
  });
});

describe("summarizeAccess", () => {
  it("conta pessoas distintas, não acessos", () => {
    const s = summarizeAccess([
      log({ actorProfileId: "a" }),
      log({ actorProfileId: "a", occurredAt: min(5) }),
      log({ actorProfileId: "b", occurredAt: min(5) }),
    ]);
    expect(s.atoresDistintos).toBe(2);
  });

  it("o último acesso considera qualquer ação, não só visualização", () => {
    const s = summarizeAccess([
      log({ occurredAt: min(0) }),
      log({ action: "GRANT_ADVISOR_WRITE", occurredAt: min(90) }),
    ]);
    expect(s.ultimoAcesso).toEqual(min(90));
  });

  it("sem registro nenhum, não inventa data", () => {
    const s = summarizeAccess([]);
    expect(s.ultimoAcesso).toBeNull();
    expect(s.atoresDistintos).toBe(0);
  });
});
