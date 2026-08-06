import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { isSupabaseMode } from "@/lib/env";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Studio sign in — Earth Unseen",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl tracking-tight">Earth</span>
          <span className="font-display text-2xl italic opacity-70">Unseen</span>
        </div>
        <p className="eyebrow mt-8 text-muted">Studio</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Enter your password to manage the collection. This area is private —
          only the owner of the site can access it.
        </p>
        <LoginForm showEmail={isSupabaseMode()} />
      </div>
    </div>
  );
}
