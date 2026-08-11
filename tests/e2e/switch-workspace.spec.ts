import { expect, test } from "@playwright/test";
import { getSessionCookies } from "./helpers/auth";
import {
  addSecondWorkspaceMembership,
  cleanupE2EUser,
  cleanupSecondWorkspace,
  createE2EUser,
  type E2ETestUserWithSecondWorkspace,
} from "./helpers/fixtures";

// Spec isolado, com login e sessão próprios (nunca reaproveita o
// storageState compartilhado dos outros specs) — usuário com 2
// memberships tem ordem não garantida entre elas (resolveActiveMembership
// sem cookie cai em memberships[0], que o Prisma não garante ordenar);
// arriscaria os outros specs operarem no workspace errado às vezes.
test.use({ storageState: { cookies: [], origins: [] } });

let user: E2ETestUserWithSecondWorkspace;

test.beforeAll(async () => {
  const base = await createE2EUser();
  user = await addSecondWorkspaceMembership(base);
});

test.afterAll(async () => {
  await cleanupSecondWorkspace(user.secondWorkspaceId);
  await cleanupE2EUser(user);
});

test("troca de workspace pelo seletor da sidebar", async ({ page, context }) => {
  const cookies = await getSessionCookies(user.email);
  await context.addCookies(cookies);

  await page.goto("/painel");
  await expect(page).toHaveURL(/\/painel$/);

  // WorkspaceSwitcher é montado 2x no DOM (sidebar desktop sempre montada +
  // header mobile) — escopar pro <aside> evita ambiguidade em viewport
  // desktop (padrão do projeto, chromium/Desktop Chrome).
  const switcher = page.locator("aside").getByLabel("Trocar de workspace");
  await expect(switcher).toBeVisible();

  await switcher.selectOption({ value: user.secondWorkspaceId });

  await expect(page).toHaveURL(/\/painel$/);
  // Só aparece quando a Membership ativa é ADVISOR (WorkspaceSwitcher.tsx)
  // — confirma que a troca realmente mudou o workspace ativo, não só o
  // valor selecionado no <select>.
  await expect(page.locator("aside").getByText("você está em workspace de cliente")).toBeVisible();
});
