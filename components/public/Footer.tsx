import Link from "next/link";
import { ArrowUpRight, AtSign, Globe, Mail } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import {
  instagramHandle,
  instagramUrl,
  websiteLabel,
  websiteUrl,
} from "@/lib/profile";
import type { Profile } from "@/lib/types";

const LINK = "text-sm text-ink/80 transition-colors hover:text-ink";

export function Footer({ profile }: { profile: Profile }) {
  const year = new Date().getUTCFullYear();
  const instagram = instagramUrl(profile.instagram);
  const website = websiteUrl(profile.website);
  const owner = profile.name || "the photographer";

  return (
    <footer className="border-t border-hairline">
      <div className="container-site grid gap-10 py-14 sm:py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-2xl tracking-tight">
            Earth <span className="italic opacity-70">Unseen</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Landscape and wildlife photographed in the field, collected by
            season{profile.name ? ` by ${profile.name}` : ""}. Camera or phone —
            the light does the work.
          </p>
          {(profile.email || instagram || website) && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Elsewhere">
              {profile.email && (
                <li>
                  <a
                    href={`mailto:${profile.email}`}
                    aria-label={`Email ${owner}`}
                    className="grid size-9 place-items-center rounded-full border border-hairline text-ink/75 transition-colors hover:border-ink/40 hover:text-ink"
                  >
                    <Mail className="size-4" />
                  </a>
                </li>
              )}
              {instagram && (
                <li>
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram ${instagramHandle(profile.instagram) ?? ""}`}
                    className="grid size-9 place-items-center rounded-full border border-hairline text-ink/75 transition-colors hover:border-ink/40 hover:text-ink"
                  >
                    <AtSign className="size-4" />
                  </a>
                </li>
              )}
              {website && (
                <li>
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Website ${websiteLabel(profile.website) ?? ""}`}
                    className="grid size-9 place-items-center rounded-full border border-hairline text-ink/75 transition-colors hover:border-ink/40 hover:text-ink"
                  >
                    <Globe className="size-4" />
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow text-muted">Seasons</p>
          <ul className="mt-4 space-y-2">
            {SEASONS.map((season) => (
              <li key={season}>
                <Link href={`/seasons/${season}`} className={LINK}>
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
              <Link href="/work" className={LINK}>
                All work
              </Link>
            </li>
            <li>
              <Link href="/about" className={LINK}>
                About the photographer
              </Link>
            </li>
            <li>
              <Link href="/contact" className={LINK}>
                Contact
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
                className={`inline-flex items-center gap-1 ${LINK}`}
              >
                Featured work
                <ArrowUpRight className="size-3.5" />
              </Link>
            </li>
            <li>
              <Link
                href="/#seasons"
                className={`inline-flex items-center gap-1 ${LINK}`}
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
          <p>
            © {year} {profile.name || "Earth Unseen"}. All photographs ©{" "}
            {owner}.
          </p>
          <p className="uppercase tracking-[0.25em]">
            {profile.location || "Shot on camera & phone"}
          </p>
        </div>
      </div>
    </footer>
  );
}
