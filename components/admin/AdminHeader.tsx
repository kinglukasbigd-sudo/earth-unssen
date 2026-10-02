"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  Images,
  Inbox,
  KeyRound,
  LayoutPanelTop,
  LogOut,
  MonitorPlay,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/admin";

const TABS = [
  { href: "/admin", label: "Manage", icon: Images },
  { href: "/admin/upload", label: "Upload", icon: UploadCloud },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
  { href: "/admin/start-screen", label: "Hero background", icon: LayoutPanelTop },
  { href: "/admin/intro-cover", label: "Intro cover", icon: MonitorPlay },
  { href: "/admin/seasons", label: "Seasons", icon: CalendarDays },
];

export function AdminHeader({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const accountActive = pathname === "/admin/account";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur-md">
      <div className="container-site flex h-14 items-center justify-between gap-4">
        <Link href="/admin" className="flex items-baseline gap-1.5">
          <span className="font-display text-lg tracking-tight">Earth</span>
          <span className="font-display text-lg italic opacity-70">Unseen</span>
          <span className="ml-1 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted">
            Studio
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted transition-colors hover:bg-paper-deep hover:text-ink sm:inline-flex"
          >
            View site
            <ExternalLink className="size-3.5" />
          </a>
          <Link
            href="/admin/account"
            aria-current={accountActive ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              accountActive
                ? "bg-ink text-paper"
                : "text-muted hover:bg-paper-deep hover:text-ink"
            }`}
          >
            <KeyRound className="size-3.5" />
            <span className="hidden sm:inline">Account</span>
          </Link>
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

      <nav
        className="container-site -mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]"
        aria-label="Studio sections"
      >
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1.5 text-sm transition-colors ${
                active
                  ? "border-ink text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
              {tab.href === "/admin/inbox" && unread > 0 && (
                <span
                  className="ml-0.5 grid min-w-5 place-items-center rounded-full bg-fall px-1.5 text-[0.65rem] font-semibold tabular-nums text-paper"
                  aria-label={`${unread} unread`}
                >
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
