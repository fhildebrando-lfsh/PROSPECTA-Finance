import { describe, expect, it } from "vitest";
import { isInviteExpired } from "@/lib/workspace/invite";

describe("isInviteExpired (Fase 2 Etapa 4 — expiração de convite, §13)", () => {
  const now = new Date("2026-08-10T12:00:00Z");

  it("sem expiresAt (convite legado), nunca expira", () => {
    expect(isInviteExpired({ expiresAt: null }, now)).toBe(false);
  });

  it("expiresAt no futuro, não expirou", () => {
    expect(isInviteExpired({ expiresAt: new Date("2026-08-11T00:00:00Z") }, now)).toBe(false);
  });

  it("expiresAt no passado, expirou", () => {
    expect(isInviteExpired({ expiresAt: new Date("2026-08-09T00:00:00Z") }, now)).toBe(true);
  });

  it("expiresAt exatamente agora, ainda não expirou (limite exclusivo)", () => {
    expect(isInviteExpired({ expiresAt: now }, now)).toBe(false);
  });
});
