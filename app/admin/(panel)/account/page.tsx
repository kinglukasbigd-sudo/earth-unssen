import { getAccountInfo } from "@/lib/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { PasswordForm } from "@/components/admin/PasswordForm";

const SOURCE_TEXT = {
  default:
    "You are signing in with the built-in default password. Set your own below — it will replace the default straight away.",
  env: "Your password currently comes from ADMIN_PASSWORD in the server’s environment. A password set here takes precedence over it.",
  studio:
    "Your password was set here in the studio. It is stored as a secure hash on the server, never in plain text.",
} as const;

export default async function AccountPage() {
  const account = await getAccountInfo();

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow text-muted">Security</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">Account</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Change the password you use to sign in to the studio.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-hairline bg-white/40 p-6">
            <p className="eyebrow text-muted">Password</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              Set a new password
            </h2>
            <div className="mt-6 max-w-md">
              <PasswordForm minLength={MIN_PASSWORD_LENGTH} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-hairline bg-white/40 p-6 text-sm leading-relaxed text-muted">
            <p className="eyebrow">Signed in</p>
            {account.mode === "supabase" ? (
              <>
                <p className="mt-3 text-ink">{account.email ?? "Admin"}</p>
                <p className="mt-3">
                  Your password is managed by Supabase Auth. If you ever forget
                  it, reset it in the Supabase dashboard under{" "}
                  <span className="text-ink">Authentication → Users</span>.
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-ink">Studio administrator</p>
                {account.passwordSource && (
                  <p className="mt-3">{SOURCE_TEXT[account.passwordSource]}</p>
                )}
                <p className="mt-3">
                  Changing it signs out every other browser. Forgotten it? On the
                  server, run{" "}
                  <code className="rounded bg-paper-deep px-1 py-0.5 font-mono text-xs text-ink">
                    npm run admin:password -- &quot;new password&quot;
                  </code>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
