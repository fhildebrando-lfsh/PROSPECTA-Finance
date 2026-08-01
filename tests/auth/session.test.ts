import { describe, expect, it } from "vitest";
import { can } from "@/lib/auth/session";

describe("can (RBAC — Arquitetura de Identidade/Planos §8)", () => {
  it.each(["TITULAR", "MEMBRO", "ADVISOR"] as const)("%s pode escrever", (role) => {
    expect(can("write", { role, platformRole: "NONE" })).toBe(true);
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
});
