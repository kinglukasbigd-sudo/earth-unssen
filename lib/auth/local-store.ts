import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Local-mode credentials, kept outside the content database:
 * - `sessionSecret`: generated on first use when SESSION_SECRET is unset;
 * - `passwordHash`: set from the studio (or `npm run admin:password`) and
 *   takes precedence over ADMIN_PASSWORD.
 */
export interface LocalAuthFile {
  sessionSecret?: string;
  passwordHash?: string;
}

const AUTH_FILE = path.join(process.cwd(), "data", "auth.json");

export function readLocalAuth(): LocalAuthFile {
  try {
    const parsed = JSON.parse(readFileSync(AUTH_FILE, "utf8")) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const { sessionSecret, passwordHash } = parsed as Record<string, unknown>;
    return {
      sessionSecret: typeof sessionSecret === "string" ? sessionSecret : undefined,
      passwordHash: typeof passwordHash === "string" ? passwordHash : undefined,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[auth] failed to read data/auth.json:", error);
    }
    return {};
  }
}

export function writeLocalAuth(next: LocalAuthFile): void {
  mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  const tmp = `${AUTH_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(next, null, 2), { encoding: "utf8", mode: 0o600 });
  renameSync(tmp, AUTH_FILE);
}
