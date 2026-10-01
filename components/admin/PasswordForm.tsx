"use client";

import { useActionState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { changePasswordAction, type PasswordState } from "@/lib/actions/admin";
import { Button, Field, Spinner } from "@/components/admin/ui";

const initialState: PasswordState = {};

export function PasswordForm({ minLength }: { minLength: number }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <Field
        label="Current password"
        id="current"
        name="current"
        type="password"
        autoComplete="current-password"
        required
      />
      <Field
        label="New password"
        id="next"
        name="next"
        type="password"
        autoComplete="new-password"
        minLength={minLength}
        required
        hint={`At least ${minLength} characters. A short sentence is easy to remember and hard to guess.`}
      />
      <Field
        label="Repeat new password"
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={minLength}
        required
      />

      {state.error && (
        <p
          className="rounded-md border border-[#9c3f2d]/30 bg-[#9c3f2d]/5 px-3.5 py-2.5 text-sm text-[#85352a]"
          role="alert"
        >
          {state.error}
        </p>
      )}
      {state.ok && (
        <p
          className="flex items-start gap-2 rounded-md border border-spring/40 bg-spring-soft px-3.5 py-2.5 text-sm text-spring-deep"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          Password changed. Use it the next time you sign in.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? <Spinner className="size-4 text-paper" /> : <KeyRound className="size-4" />}
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
