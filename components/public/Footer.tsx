import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";

export function Footer() {
  const year = new Date().getUTCFullYear();
  return (
    <footer className="border-t border-hairline">
      <div className="container-site grid gap-10 py-14 sm:py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-2xl tracking-tight">
            Earth <span className="italic opacity-70">Unseen</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Landscape and wildlife photographed in the field, collected by
            season. Camera or phone — the light does the work.
          </p>
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow text-muted">Seasons</p>
          <ul className="mt-4 space-y-2">
            {SEASONS.map((season) => (
              <li key={season}>
                <Link
                  href={`/seasons/${season}`}
                  className="text-sm text-ink/80 transition-colors hover:text-ink"
                >
                  {seasonInfo(season).label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow text-muted">Journal</p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                href="/about"
                className="text-sm text-ink/80 transition-colors hover:text-ink"
              >
                About the photographer
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow text-muted">Index</p>
          <ul className="mt-4 space-y-2">
            <li>
              <Link
                href="/#featured"
                className="inline-flex items-center gap-1 text-sm text-ink/80 transition-colors hover:text-ink"
              >
                Featured work
                <ArrowUpRight className="size-3.5" />
              </Link>
            </li>
            <li>
              <Link
                href="/#seasons"
                className="inline-flex items-center gap-1 text-sm text-ink/80 transition-colors hover:text-ink"
              >
                The four seasons
                <ArrowUpRight className="size-3.5" />
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="container-site flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Earth Unseen. All photographs © the photographer.</p>
          <p className="uppercase tracking-[0.25em]">
            Shot on camera & phone
          </p>
        </div>
      </div>
    </footer>
  );
}
