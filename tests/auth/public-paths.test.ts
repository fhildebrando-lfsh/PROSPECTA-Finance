import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/auth/public-paths";

/**
 * Regressão de um bug real (2026-08-16): `/api/cron/automations` não estava na
 * lista, o middleware redirecionava para `/login` antes de o handler rodar, e a
 * automação nunca executava — em silêncio, porque o 302 conta como resposta
 * bem-sucedida. Middleware não é exercitado por nenhuma suíte; esta lista é a
 * única parte testável dessa decisão, por isso o teste existe.
 */
describe("isPublicPath", () => {
  it("libera a rota de cron — chamada pelo Vercel Cron, sem cookie de sessão", () => {
    expect(isPublicPath("/api/cron/automations")).toBe(true);
    expect(isPublicPath("/api/cron")).toBe(true);
  });

  it("libera o fluxo de entrada e as páginas públicas", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login?redirectTo=/painel")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/redefinir-senha")).toBe(true);
    expect(isPublicPath("/politica-privacidade")).toBe(true);
  });

  it("NÃO libera as rotas de API de usuário — essas dependem de sessão", () => {
    expect(isPublicPath("/api/entries")).toBe(false);
    expect(isPublicPath("/api/import/preview")).toBe(false);
    expect(isPublicPath("/api/me/export")).toBe(false);
  });

  it("NÃO libera as telas do app", () => {
    expect(isPublicPath("/painel")).toBe(false);
    expect(isPublicPath("/painel/assistente")).toBe(false);
    expect(isPublicPath("/patrimonio/funcao")).toBe(false);
    expect(isPublicPath("/admin/usuarios")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
  });

  it("não libera caminho que apenas contém um prefixo público no meio", () => {
    expect(isPublicPath("/workspace/login")).toBe(false);
    expect(isPublicPath("/api/entries/api/cron")).toBe(false);
  });
});
