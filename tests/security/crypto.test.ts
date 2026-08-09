import { beforeAll, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/security/crypto";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = "chave-de-teste-nao-usada-em-producao";
});

describe("encrypt/decrypt (AES-256-GCM, lib/security/crypto.ts)", () => {
  it("faz round-trip de um texto qualquer", () => {
    const original = "1//0gLongLivedRefreshTokenDoGoogle";
    expect(decrypt(encrypt(original))).toBe(original);
  });

  it("gera saídas diferentes pra o mesmo texto (IV aleatório)", () => {
    const a = encrypt("mesmo-texto");
    const b = encrypt("mesmo-texto");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("mesmo-texto");
    expect(decrypt(b)).toBe("mesmo-texto");
  });

  it("lança se o texto cifrado foi adulterado", () => {
    const cipher = encrypt("dado-sensivel");
    const [iv, tag, data] = cipher.split(":");
    const tampered = [iv, tag, data.slice(0, -2) + (data.at(-1) === "A" ? "B" : "A") + "="].join(":");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("lança se TOKEN_ENCRYPTION_KEY não estiver configurada", () => {
    const original = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    expect(() => encrypt("x")).toThrow("TOKEN_ENCRYPTION_KEY");
    process.env.TOKEN_ENCRYPTION_KEY = original;
  });
});
