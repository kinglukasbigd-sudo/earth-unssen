import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ToastProvider } from "@/components/admin/toast";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-dvh bg-paper">
      <ToastProvider>
        <AdminHeader />
        {children}
      </ToastProvider>
    </div>
  );
}
