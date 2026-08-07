"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Images, LayoutPanelTop, LogOut, UploadCloud } from "lucide-react";
import { logoutAction } from "@/lib/actions/admin";

const TABS = [
  { href: "/admin", label: "Manage", icon: Images },
  { href: "/admin/upload", label: "Upload", icon: UploadCloud },
  { href: "/admin/start-screen", label: "Start screen", icon: LayoutPanelTop },
];

export function AdminHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur-md">
      <div className="container-site flex h-16 items-center justify-between gap-4">
        <Link href="/admin" className="flex items-baseline gap-1.5">
          <span className="font-display text-lg tracking-tight">Earth</span>
          <span className="font-display text-lg italic opacity-70">Unseen</span>
          <span className="ml-1 hidden text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted sm:inline">
            Studio
          </span>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg border border-hairline bg-white/50 p-1" aria-label="Admin">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-ink text-paper"
                    : "text-muted hover:bg-paper-deep hover:text-ink"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <tab.icon className="size-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink sm:inline-flex"
          >
            View site
            <ExternalLink className="size-3.5" />
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-paper-deep hover:text-ink"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
