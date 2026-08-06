import { cookies } from "next/headers";
import { ADMIN_EMAIL, ADMIN_PASSWORD, isSupabaseMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import {
  createSessionToken,
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/auth/session";

function emailMatches(email: string | undefined): boolean {
  if (!ADMIN_EMAIL) return true;
  return (
    !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );
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
  return verifySessionToken(store.get(SESSION_COOKIE)?.value ?? "");
}

export async function loginAdmin(
  password: string,
  email?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (isSupabaseMode()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email ?? ADMIN_EMAIL,
      password,
    });
    if (error) return { ok: false, error: "Incorrect email or password." };
    return { ok: true };
  }
  if (password !== ADMIN_PASSWORD) {
    return { ok: false, error: "Incorrect password." };
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
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
