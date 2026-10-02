import { cookies } from "next/headers";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  DEFAULT_ADMIN_PASSWORD,
  isSupabaseMode,
} from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import {
  createSessionToken,
  passwordVersion,
  readSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth/session";
import { readLocalAuth, writeLocalAuth } from "@/lib/auth/local-store";
import {
  hashPassword,
  passwordProblem,
  safeEqual,
  verifyPasswordHash,
} from "@/lib/auth/password";
import { allowAttempt, clientIp } from "@/lib/rate-limit";

function emailMatches(email: string | undefined): boolean {
  if (!ADMIN_EMAIL) return true;
  return (
    !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
}

/** Where the local-mode password currently comes from. */
export type LocalPasswordSource = "studio" | "env" | "default";

function localPasswordSource(): LocalPasswordSource {
  if (readLocalAuth().passwordHash) return "studio";
  return ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD ? "default" : "env";
}

/** What the session's password-version claim must match right now. */
function currentPasswordVersion(): string {
  const stored = readLocalAuth().passwordHash;
  return passwordVersion(stored ? `hash:${stored}` : `env:${ADMIN_PASSWORD}`);
}

async function checkLocalPassword(password: string): Promise<boolean> {
  const stored = readLocalAuth().passwordHash;
  if (stored) return verifyPasswordHash(password, stored);
  return safeEqual(password, ADMIN_PASSWORD);
}

async function setSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(currentPasswordVersion()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Server-side admin check for layouts, pages and server actions. */
export async function isAdmin(): Promise<boolean> {
  if (isSupabaseMode()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user && emailMatches(user.email ?? undefined);
  }
  const store = await cookies();
  const claims = readSessionToken(store.get(SESSION_COOKIE)?.value ?? "");
  return !!claims && claims.pv === currentPasswordVersion();
}

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function loginAdmin(
  password: string,
  email?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!allowAttempt(`login:${await clientIp()}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    return {
      ok: false,
      error: "Too many sign-in attempts. Please wait 15 minutes and try again.",
    };
  }
  if (!password) return { ok: false, error: "Enter your password." };

  if (isSupabaseMode()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email ?? ADMIN_EMAIL,
      password,
    });
    if (error) return { ok: false, error: "Incorrect email or password." };
    return { ok: true };
  }
  if (!(await checkLocalPassword(password))) {
    return { ok: false, error: "Incorrect password." };
  }
  await setSessionCookie();
  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  if (isSupabaseMode()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return;
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export interface AccountInfo {
  mode: "local" | "supabase";
  /** Supabase: the signed-in admin's email. */
  email: string | null;
  /** Local: where the password comes from. */
  passwordSource: LocalPasswordSource | null;
}

export async function getAccountInfo(): Promise<AccountInfo> {
  if (isSupabaseMode()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { mode: "supabase", email: user?.email ?? null, passwordSource: null };
  }
  return { mode: "local", email: null, passwordSource: localPasswordSource() };
}

/** True while local mode still accepts the published default password. */
export function isUsingDefaultPassword(): boolean {
  return !isSupabaseMode() && localPasswordSource() === "default";
}

/**
 * Change the admin password after re-checking the current one. Local mode
 * stores an scrypt hash in data/auth.json (overriding ADMIN_PASSWORD) and
 * signs out every other session; Supabase mode updates the Auth user.
 */
export async function changeAdminPassword(
  current: string,
  next: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!allowAttempt(`password:${await clientIp()}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    return { ok: false, error: "Too many attempts. Please wait 15 minutes." };
  }
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: problem };
  if (next === current) {
    return { ok: false, error: "Choose a password different from the current one." };
  }

  if (isSupabaseMode()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return { ok: false, error: "Your session has expired. Sign in again." };
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (checkError) return { ok: false, error: "Your current password is incorrect." };
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  if (!(await checkLocalPassword(current))) {
    return { ok: false, error: "Your current password is incorrect." };
  }
  try {
    writeLocalAuth({ ...readLocalAuth(), passwordHash: await hashPassword(next) });
  } catch (error) {
    console.error("[auth] failed to store the new password", error);
    return {
      ok: false,
      error: "Couldn’t save the new password on this server. Set ADMIN_PASSWORD instead.",
    };
  }
  // Re-issue this browser's cookie for the new password version.
  await setSessionCookie();
  return { ok: true };
}
