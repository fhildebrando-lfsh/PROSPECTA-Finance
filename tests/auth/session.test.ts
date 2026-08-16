import { describe, expect, it } from "vitest";
import { can, resolveActiveMembership } from "@/lib/auth/session";

describe("can (RBAC — Arquitetura de Identidade/Planos §8)", () => {
  it.each(["TITULAR", "MEMBRO"] as const)("%s pode escrever, sem depender de advisorCanWrite", (role) => {
    expect(can("write", { role, platformRole: "NONE" })).toBe(true);
    expect(can("write", { role, platformRole: "NONE", advisorCanWrite: false })).toBe(true);
  });

  it("LEITURA não pode escrever", () => {
    expect(can("write", { role: "LEITURA", platformRole: "NONE" })).toBe(false);
  });

  it("sem role nenhum não pode escrever", () => {
    expect(can("write", { platformRole: "NONE" })).toBe(false);
  });

  it("PLATFORM_ADMIN pode escrever mesmo com role LEITURA", () => {
    expect(can("write", { role: "LEITURA", platformRole: "PLATFORM_ADMIN" })).toBe(true);
  });

  it("nenhum papel de workspace pode gerenciar taxonomia", () => {
    for (const role of ["TITULAR", "MEMBRO", "LEITURA", "ADVISOR"] as const) {
      expect(can("manageTaxonomy", { role, platformRole: "NONE" })).toBe(false);
    }
  });

  it("PLATFORM_ADMIN pode gerenciar taxonomia", () => {
    expect(can("manageTaxonomy", { platformRole: "PLATFORM_ADMIN" })).toBe(true);
  });

  describe("ADVISOR — escrita exige concessão explícita (Etapa 0, 2026-08-15)", () => {
    it("sem advisorCanWrite (ausente) não pode escrever — padrão seguro, mudou de comportamento", () => {
      expect(can("write", { role: "ADVISOR", platformRole: "NONE" })).toBe(false);
    });

    it("advisorCanWrite = false não pode escrever", () => {
      expect(can("write", { role: "ADVISOR", platformRole: "NONE", advisorCanWrite: false })).toBe(false);
    });

    it("advisorCanWrite = true pode escrever", () => {
      expect(can("write", { role: "ADVISOR", platformRole: "NONE", advisorCanWrite: true })).toBe(true);
    });

    it("advisorCanWrite não afeta outros papéis", () => {
      expect(can("write", { role: "MEMBRO", platformRole: "NONE", advisorCanWrite: false })).toBe(true);
      expect(can("write", { role: "LEITURA", platformRole: "NONE", advisorCanWrite: true })).toBe(false);
    });
  });
});

describe("resolveActiveMembership (seletor de workspace — Fase 2 Etapa 3)", () => {
  const own = { workspaceId: "own", status: "ACTIVE" as const, role: "TITULAR" as const };
  const client = { workspaceId: "client", status: "ACTIVE" as const, role: "ADVISOR" as const };
  const revoked = { workspaceId: "revoked", status: "REVOKED" as const, role: "ADVISOR" as const };

  it("sem workspaceId pedido, cai na primeira membership (comportamento de sempre)", () => {
    expect(resolveActiveMembership([own, client])).toBe(own);
  });

  it("com workspaceId pedido e válido, usa essa membership mesmo não sendo a primeira", () => {
    expect(resolveActiveMembership([own, client], "client")).toBe(client);
  });

  it("workspaceId pedido mas revogado (status != ACTIVE) cai na primeira, ignora o pedido", () => {
    expect(resolveActiveMembership([own, revoked], "revoked")).toBe(own);
  });

  it("workspaceId pedido que não pertence a nenhuma membership da pessoa cai na primeira", () => {
    expect(resolveActiveMembership([own, client], "workspace-de-outra-pessoa")).toBe(own);
  });

  it("sem membership nenhuma, retorna undefined", () => {
    expect(resolveActiveMembership([])).toBeUndefined();
  });

  it("primeira membership revogada e sem workspaceId pedido, pula para próxima ACTIVE", () => {
    expect(resolveActiveMembership([revoked, own])).toBe(own);
  });

  it("única membership revogada, retorna undefined (não trata revogada como ativa)", () => {
    expect(resolveActiveMembership([revoked])).toBeUndefined();
  });

  it("não considera workspace bloqueado — resolução de membership e bloqueio de acesso são checados em lugares diferentes de propósito", () => {
    const blocked = {
      workspaceId: "blocked",
      status: "ACTIVE" as const,
      role: "TITULAR" as const,
      workspace: { blockedAt: new Date() },
    };
    expect(resolveActiveMembership([blocked])).toBe(blocked);
  });
});
