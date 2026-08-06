"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/admin";
import { Button, Field, Spinner } from "@/components/admin/ui";

const initialState: LoginState = {};

export function LoginForm({ showEmail }: { showEmail: boolean }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {showEmail && (
        <Field
          label="Email"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      )}
      <Field
        label="Password"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
      />

      {state?.error && (
        <p
          className="rounded-md border border-[#9c3f2d]/30 bg-[#9c3f2d]/5 px-3.5 py-2.5 text-sm text-[#85352a]"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Spinner className="size-4 text-paper" /> : <Lock className="size-4" />}
        {pending ? "Signing in…" : "Sign in to the studio"}
      </Button>
    </form>
  );
}
