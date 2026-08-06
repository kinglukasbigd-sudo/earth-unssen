"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";

const NAV_ITEMS = [
  ...SEASONS.map((season) => ({
    href: `/seasons/${season}`,
    label: seasonInfo(season).label,
  })),
  { href: "/about", label: "About" },
];

function seasonOf(pathname: string): string | null {
  const match = pathname.match(/^\/seasons\/(winter|spring|summer|fall)$/);
  return match ? match[1] : null;
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const activeSeason = seasonOf(pathname ?? "");
  const overHero = pathname === "/" && !scrolled && !menuOpen;
  const light = overHero;

  return (
    <header className="fixed inset-x-0 top-0 z-[70]">
      <div
        className={`transition-colors duration-300 ${
          light
            ? "bg-transparent text-white"
            : "border-b border-hairline bg-paper/85 text-ink backdrop-blur-md"
        }`}
      >
        <div className="container-site flex h-16 items-center justify-between sm:h-20">
          <Link
            href="/"
            aria-label="Earth Unseen — home"
            className="group flex items-baseline gap-1.5"
          >
            <span className="font-display text-xl tracking-tight sm:text-2xl">
              Earth
            </span>
            <span className="font-display text-xl italic tracking-tight text-current opacity-70 sm:text-2xl">
              Unseen
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/about"
                  ? pathname === "/about"
                  : activeSeason === item.href.replace("/seasons/", "");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group relative py-1 text-[0.8rem] font-medium tracking-wide transition-opacity"
                >
                  <span className={active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}>
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    className={`absolute -bottom-0.5 left-0 h-px bg-current transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <button
            className="grid size-11 place-items-center md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[-1] flex flex-col bg-paper text-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="container-site flex h-16 items-center justify-between sm:h-20">
              <span className="font-display text-xl tracking-tight">
                Earth{" "}
                <span className="italic opacity-70">Unseen</span>
              </span>
            </div>
            <nav className="container-site flex flex-1 flex-col justify-center gap-1 py-10" aria-label="Mobile">
              {NAV_ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="group flex items-baseline justify-between border-b border-hairline py-4"
                  >
                    <span className="font-display text-4xl tracking-tight sm:text-5xl">
                      {item.label}
                    </span>
                    <span className="text-xs uppercase tracking-[0.25em] text-muted">
                      No. 0{i + 1}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="container-site pb-10 text-xs uppercase tracking-[0.25em] text-muted"
            >
              Photographed in the field · Earth Unseen
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
