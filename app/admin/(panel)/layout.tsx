import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { isAdmin, isUsingDefaultPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ToastProvider } from "@/components/admin/toast";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const unread = await db.countUnreadMessages().catch(() => 0);
  const defaultPassword = isUsingDefaultPassword();

  return (
    <div className="min-h-dvh bg-paper">
      <ToastProvider>
        <AdminHeader unread={unread} />
        {defaultPassword && (
          <div className="border-b border-summer/40 bg-summer-soft">
            <div className="container-site flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <p className="flex items-center gap-2 text-summer-deep">
                <ShieldAlert className="size-4 shrink-0" />
                You’re using the default studio password. Anyone who knows it
                can sign in — set your own.
              </p>
              <Link
                href="/admin/account"
                className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-ink/85"
              >
                Change password
              </Link>
            </div>
          </div>
        )}
        {children}
      </ToastProvider>
    </div>
  );
}
