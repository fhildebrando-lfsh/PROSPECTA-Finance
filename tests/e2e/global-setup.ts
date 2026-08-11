import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { getSessionCookies } from "./helpers/auth";
import { createE2EUser } from "./helpers/fixtures";

const AUTH_DIR = path.join(__dirname, ".auth");
export const AUTH_FILE = path.join(AUTH_DIR, "session.json");
export const USER_FILE = path.join(AUTH_DIR, "user.json");

/**
 * Roda uma vez antes de toda a suíte: cria o usuário/workspace de teste
 * (Admin API + Prisma), troca por uma sessão real via magic link e grava o
 * storageState no formato que o Playwright entende (cookies + localStorage)
 * — todo `test()` depois disso já nasce autenticado, sem precisar logar de
 * novo em cada spec (ver `use.storageState` em playwright.config.ts).
 */
export default async function globalSetup() {
  const user = await createE2EUser();
  const cookies = await getSessionCookies(user.email);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies(cookies);

  mkdirSync(AUTH_DIR, { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  await browser.close();

  writeFileSync(USER_FILE, JSON.stringify(user), "utf-8");
}
