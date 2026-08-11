import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { E2ETestUser } from "./helpers/fixtures";
import { USER_FILE } from "./global-setup";

const user: E2ETestUser = JSON.parse(readFileSync(USER_FILE, "utf-8"));

// Mesma amostra de tests/import/parse-ofx.test.ts (LOOSE_SGML_SAMPLE) — SGML
// solto real de banco, tags de valor sem fechamento, 2 transações.
const OFX_SAMPLE = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260705120000[-3:BRT]
<TRNAMT>-45.90
<FITID>202607050001
<MEMO>MERCADO LIVRE
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260710
<TRNAMT>+1500.00
<FITID>202607100002
<NAME>SALARIO
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

test("importa um extrato OFX (SGML solto) e confirma as 2 transações", async ({ page }) => {
  await page.goto("/lancamentos/importar");

  await page.locator('input[type="file"]').setInputFiles({
    name: "extrato-teste.ofx",
    mimeType: "application/x-ofx",
    buffer: Buffer.from(OFX_SAMPLE, "utf-8"),
  });

  // OFX não traz carteira/responsável/categoria por linha — mini-form
  // pedido uma vez para o extrato inteiro, antes do preview.
  await page.getByLabel("Carteira", { exact: false }).selectOption({ label: user.walletName });
  await page.getByLabel("Responsável", { exact: false }).selectOption({ label: user.personName });
  await page.getByLabel("Categoria padrão (despesas sem histórico)").selectOption({ index: 1 });
  await page.getByLabel("Categoria padrão (receitas sem histórico)").selectOption({ index: 1 });

  await page.getByRole("button", { name: "Validar" }).click();

  const commitButton = page.getByRole("button", { name: /Confirmar importação/ });
  await expect(commitButton).toBeEnabled();
  await expect(commitButton).toHaveText(/Confirmar importação \(2 lançamentos\)/);
  await commitButton.click();

  await expect(page.getByText("Importação concluída")).toBeVisible();
  await expect(page.getByText(/2 lançamentos importados/)).toBeVisible();
});
