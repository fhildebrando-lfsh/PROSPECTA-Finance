import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { E2ETestUser } from "./helpers/fixtures";
import { USER_FILE } from "./global-setup";

const user: E2ETestUser = JSON.parse(readFileSync(USER_FILE, "utf-8"));

test("importa um CSV pequeno e confirma o lançamento importado", async ({ page }) => {
  const description = `[e2e] importado csv ${Date.now()}`;
  const csv = [
    "Compra,Vence,Tipo de Carteira,Tipo,Categoria,Subcategoria,Descrição,Responsáveis,Valor,Recorrência,Situação,Observação",
    `11/08/2026,11/08/2026,${user.walletName},DESPESA,1.Alimentação,,${description},${user.personName},"-50,00",1,Pago,`,
  ].join("\n");

  await page.goto("/lancamentos/importar");

  await page.locator('input[type="file"]').setInputFiles({
    name: "teste-e2e.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csv, "utf-8"),
  });

  const commitButton = page.getByRole("button", { name: /Confirmar importação/ });
  await expect(commitButton).toBeEnabled();
  await expect(commitButton).toHaveText(/Confirmar importação \(1 lançamentos?\)/);
  await commitButton.click();

  await expect(page.getByText("Importação concluída")).toBeVisible();
  await expect(page.getByText(/1 lançamentos importados/)).toBeVisible();

  await page.getByRole("button", { name: "Ver lançamentos" }).click();
  await expect(page).toHaveURL(/\/lancamentos$/);
  await expect(page.getByText(description).first()).toBeVisible();
});
