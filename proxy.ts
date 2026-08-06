import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ADMIN_EMAIL, isSupabaseMode, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

function emailMatches(email: string | undefined): boolean {
  if (!ADMIN_EMAIL) return true;
  return !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next({ request });
  }

  if (isSupabaseMode()) {
    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !emailMatches(user.email ?? undefined)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return supabaseResponse;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/admin/:path*"],
};
