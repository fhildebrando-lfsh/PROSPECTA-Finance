import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { E2ETestUser } from "./helpers/fixtures";
import { USER_FILE } from "./global-setup";

const user: E2ETestUser = JSON.parse(readFileSync(USER_FILE, "utf-8"));

test("cria um lançamento pelo formulário rápido e ele aparece em /lancamentos", async ({ page }) => {
  const description = `[e2e] lançamento de teste ${Date.now()}`;

  await page.goto("/lancamentos/novo");

  await page.getByLabel("Valor", { exact: false }).fill("123.45");
  await page.getByLabel("Carteira", { exact: false }).selectOption({ label: user.walletName });
  // "Categoria" (não "Subcategoria", que também contém a substring) —
  // primeira opção real (índice 0 é o placeholder "—").
  await page.getByLabel(/^Categoria/).selectOption({ index: 1 });
  await page.getByLabel("Responsável", { exact: false }).selectOption({ label: user.personName });
  await page.getByLabel("Situação", { exact: false }).selectOption({ label: "a pagar" });
  await page.getByLabel("Descrição", { exact: false }).fill(description);

  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page).toHaveURL(/\/lancamentos$/);
  // A tabela renderiza uma versão desktop e uma versão mobile ao mesmo
  // tempo (CSS decide qual aparece) — o texto existe duas vezes no DOM.
  await expect(page.getByText(description).first()).toBeVisible();
});
