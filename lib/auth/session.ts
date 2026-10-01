import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET } from "@/lib/env";
import { readLocalAuth, writeLocalAuth } from "@/lib/auth/local-store";

export const SESSION_COOKIE = "eu_session";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Published example values — signing with these would let anyone forge a session. */
const PLACEHOLDER_SECRETS = new Set([
  "insecure-dev-secret-change-me",
  "dev-only-change-me-to-a-long-random-string",
]);

/** In-memory secret for when data/auth.json can't be written (read-only disk). */
let unpersistedSecret: string | null = null;

/**
 * SESSION_SECRET when it is set to a real value; otherwise a random secret
 * generated once and stored in data/auth.json, so a fresh install is never
 * signed with a publicly known key.
 */
function sessionSecret(): string {
  if (SESSION_SECRET && !PLACEHOLDER_SECRETS.has(SESSION_SECRET)) {
    return SESSION_SECRET;
  }
  const stored = readLocalAuth();
  if (stored.sessionSecret && stored.sessionSecret.length >= 32) {
    return stored.sessionSecret;
  }
  if (unpersistedSecret) return unpersistedSecret;
  const generated = randomBytes(32).toString("base64url");
  try {
    writeLocalAuth({ ...stored, sessionSecret: generated });
  } catch (error) {
    console.warn(
      "[auth] could not persist a session secret; sessions end on restart. Set SESSION_SECRET instead.",
      error,
    );
    unpersistedSecret = generated;
  }
  return generated;
}

function sign(payload: string, secret = sessionSecret()): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export interface SessionClaims {
  sub: "admin";
  iat: number;
  exp: number;
  /** Password version; changes whenever the admin password changes. */
  pv: string;
}

/**
 * Fingerprint of the current password, keyed by the session secret so it
 * reveals nothing about the password itself.
 */
export function passwordVersion(passwordMaterial: string): string {
  return sign(`pv:${passwordMaterial}`).slice(0, 16);
}

export function createSessionToken(pv: string): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = { sub: "admin", iat: now, exp: now + THIRTY_DAYS, pv };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Signature- and expiry-checked claims, or null. */
export function readSessionToken(token: string): SessionClaims | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<SessionClaims>;
    if (claims.sub !== "admin") return null;
    if (typeof claims.exp !== "number") return null;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof claims.pv !== "string") return null;
    return claims as SessionClaims;
  } catch {
    return null;
  }
}

/** Cheap check for the proxy; pages and actions also verify the password version. */
export function verifySessionToken(token: string): boolean {
  return readSessionToken(token) !== null;
}

export const SESSION_MAX_AGE = THIRTY_DAYS;
