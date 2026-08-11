import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { cleanupE2EUser, type E2ETestUser } from "./helpers/fixtures";
import { AUTH_FILE, USER_FILE } from "./global-setup";

export default async function globalTeardown() {
  const user: E2ETestUser = JSON.parse(readFileSync(USER_FILE, "utf-8"));
  await cleanupE2EUser(user);
  rmSync(path.dirname(AUTH_FILE), { recursive: true, force: true });
}
