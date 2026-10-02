export type BackendMode = "auto" | "local" | "supabase";

export function backendMode(): BackendMode {
  const mode = (process.env.DATA_BACKEND ?? "auto").trim() as BackendMode;
  if (mode === "local" || mode === "supabase") return mode;
  return process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? "supabase"
    : "local";
}

export function isSupabaseMode(): boolean {
  return backendMode() === "supabase";
}

export function isLocalMode(): boolean {
  return backendMode() === "local";
}

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

/** Local-mode fallback password when ADMIN_PASSWORD is unset or empty. */
export const DEFAULT_ADMIN_PASSWORD = "earth-unseen";
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

/** Empty when unset; see lib/auth/session.ts for the generated fallback. */
export const SESSION_SECRET = process.env.SESSION_SECRET?.trim() ?? "";

export const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
