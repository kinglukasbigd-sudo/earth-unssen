import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Camera, Phone } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import { SITE_URL } from "@/lib/env";
import { Reveal } from "@/components/public/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "About Earth Unseen — a personal record of landscape and wildlife photography, photographed close to home through all four seasons.",
  openGraph: {
    title: "About — Earth Unseen",
    description:
      "A personal record of landscape and wildlife photography, one season at a time.",
    url: `${SITE_URL}/about`,
  },
};

function FieldScene() {
  return (
    <svg
      viewBox="0 0 1200 260"
      className="w-full"
      role="img"
      aria-label="Rolling hills at dusk"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8f0f6" />
          <stop offset="0.55" stopColor="#f8f0db" />
          <stop offset="1" stopColor="#f9f7f3" />
        </linearGradient>
      </defs>

      <rect width="1200" height="260" fill="url(#sky)" />

      <circle cx="980" cy="72" r="30" fill="#c79a3b" opacity="0.85" />
      <circle cx="980" cy="72" r="46" fill="#c79a3b" opacity="0.18" />

      <path
        d="M0 190 C 160 130, 360 208, 560 158 C 760 108, 980 210, 1200 152 L 1200 260 L 0 260 Z"
        fill="#6e93b3"
        opacity="0.35"
      />
      <path
        d="M0 224 C 240 176, 480 244, 760 202 C 930 176, 1080 228, 1200 208 L 1200 260 L 0 260 Z"
        fill="#84985f"
        opacity="0.45"
      />
      <path
        d="M0 262 C 300 236, 600 262, 900 240 C 1030 230, 1130 258, 1200 250 L 1200 260 L 0 260 Z"
        fill="#a85c38"
        opacity="0.4"
      />

      <g stroke="#191713" strokeWidth="2" strokeLinecap="round" opacity="0.5" fill="none">
        <path d="M860 84 q8 -10 16 0 q8 -10 16 0" />
        <path d="M700 66 q7 -8 14 0 q7 -8 14 0" transform="scale(0.85)" />
      </g>
    </svg>
  );
}

const INDEX = [
  { label: "Started", value: "2026" },
  { label: "Approach", value: "Field & light only" },
  { label: "Equipment", value: "Camera + phone" },
  { label: "Collections", value: "Four, by season" },
];

export default function AboutPage() {
  return (
    <>
      <section className="container-site pb-10 pt-36 sm:pt-44">
        <Reveal>
          <p className="eyebrow text-muted">About</p>
          <h1 className="mt-5 max-w-3xl font-display text-xxl">
            A personal archive of the natural world,{" "}
            <span className="italic text-muted">photographed close to home.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-8 max-w-2xl leading-relaxed text-muted">
            Earth Unseen is a one-person project. Every photograph here was
            taken in the field — on a camera or a phone — without staging, and
            each is filed under the season in which it was made. The site
            exists for one reason: to hold these quiet moments somewhere they
            can be looked at again.
          </p>
        </Reveal>
      </section>

      <Reveal>
        <FieldScene />
      </Reveal>

      <section className="container-site py-20 sm:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="md:sticky md:top-32">
              <p className="eyebrow text-muted">Field index</p>
              <dl className="mt-6 divide-y divide-hairline border-y border-hairline">
                {INDEX.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-4 py-4"
                  >
                    <dt className="text-xs uppercase tracking-[0.22em] text-muted">
                      {item.label}
                    </dt>
                    <dd className="font-display text-lg italic">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <Reveal>
              <h2 className="font-display text-lg-display">
                How the work gets made
              </h2>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="mt-6 space-y-5 leading-relaxed text-muted">
                <p>
                  Most of the photographs on this site are the result of slow
                  mornings and long walks. The seasons set the schedule —
                  winter is for frost and silence, spring for the return of
                  birds, summer for storm-light over open fields, and fall for
                  the last colour of the year. I try not to plan too far ahead.
                </p>
                <p>
                  The equipment is deliberately simple. Some frames are made on
                  a proper camera; others are made with the phone that is
                  always in a pocket. What matters is being outside at the
                  right hour, more than what is in the bag.
                </p>
                <p>
                  Nothing here is staged or studio-lit. The occasional fox, the
                  heron that never holds still, the hill that changes with the
                  light — these are the subjects. If a photograph is good, it
                  is usually because the weather was better than I was.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <Reveal delay={0.1}>
                <div className="rounded-lg border border-hairline p-6">
                  <Camera className="size-6" strokeWidth={1.5} />
                  <h3 className="mt-4 font-display text-xl">Camera</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    For landscapes and any moment that allows time to frame it
                    properly.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="rounded-lg border border-hairline p-6">
                  <Phone className="size-6" strokeWidth={1.5} />
                  <h3 className="mt-4 font-display text-xl">Phone</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    For wildlife and the encounters that arrive without notice.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="container-site border-t border-hairline py-20 sm:py-28">
        <Reveal>
          <p className="eyebrow text-muted">The collections</p>
          <h2 className="mt-4 font-display text-xxl">Browse by season.</h2>
        </Reveal>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SEASONS.map((season, i) => {
            const info = seasonInfo(season);
            return (
              <Reveal key={season} delay={i * 0.05}>
                <Link
                  href={`/seasons/${season}`}
                  className="group flex items-center justify-between rounded-lg border border-hairline p-5 transition-colors duration-300 hover:border-transparent"
                  style={{ backgroundColor: info.accentSoft }}
                >
                  <div>
                    <p className="font-display text-2xl italic">{info.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">
                      {info.tagline}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="size-5 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    style={{ color: info.accentDeep }}
                  />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container-site border-t border-hairline py-20 text-center sm:py-28">
        <Reveal>
          <p className="mx-auto max-w-xl font-display text-2xl leading-snug italic sm:text-3xl">
            “The camera is an excuse to be outside at the right hour.”
          </p>
          <p className="mt-6 eyebrow text-muted">
            — Earth Unseen · Est. 2026
          </p>
        </Reveal>
      </section>
    </>
  );
}
