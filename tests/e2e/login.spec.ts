import { expect, test } from "@playwright/test";

// Valida a técnica de autenticação sem senha (magic link + cookie jar,
// global-setup.ts) antes de qualquer outro spec depender dela: se o login
// não funcionar, é melhor falhar aqui, isolado, do que em todo teste.
test("usuário autenticado via magic link acessa /painel sem cair em /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/painel$/);
  await expect(page.getByText("Entre com sua conta")).not.toBeVisible();
});
