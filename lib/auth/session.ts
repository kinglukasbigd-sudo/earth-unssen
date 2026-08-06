import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET } from "@/lib/env";

export const SESSION_COOKIE = "eu_session";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: "admin", iat: now, exp: now + THIRTY_DAYS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): boolean {
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { sub?: string; exp?: number };
    if (claims.sub !== "admin") return false;
    if (typeof claims.exp !== "number") return false;
    if (claims.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}
