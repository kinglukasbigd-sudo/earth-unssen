"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Expand } from "lucide-react";
import type { Photo, Season } from "@/lib/types";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import { useLightbox } from "@/components/public/lightbox";
import { PhotoImage } from "@/components/public/PhotoImage";

type Filter = "all" | Season;

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Every photograph in one masonry grid, filterable by season. Each tile
 * opens the shared lightbox; captions link to the photograph's own page.
 */
export function WorkGallery({ photos }: { photos: Photo[] }) {
  const lightbox = useLightbox();
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const result: Record<Season, number> = { winter: 0, spring: 0, summer: 0, fall: 0 };
    for (const photo of photos) result[photo.season] += 1;
    return result;
  }, [photos]);

  const visible = useMemo(
    () => (filter === "all" ? photos : photos.filter((p) => p.season === filter)),
    [photos, filter],
  );

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: photos.length },
    ...SEASONS.map((season) => ({
      value: season,
      label: seasonInfo(season).label,
      count: counts[season],
    })),
  ];

  return (
    <div>
      <div
        role="group"
        aria-label="Filter by season"
        className="flex flex-wrap gap-2 border-b border-hairline pb-8"
      >
        {filters.map((item) => {
          const active = item.value === filter;
          const accent =
            item.value === "all" ? null : seasonInfo(item.value);
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              aria-pressed={active}
              disabled={item.count === 0 && item.value !== "all"}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline text-ink/80 hover:border-ink/40 hover:text-ink"
              }`}
            >
              {accent && (
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: accent.accent }}
                />
              )}
              {item.label}
              <span
                className={`tabular-nums text-xs ${active ? "text-paper/60" : "text-muted"}`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={filter}
        className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {visible.map((photo, index) => {
          const info = seasonInfo(photo.season);
          return (
            <figure key={photo.id} className="group/tile mb-5 break-inside-avoid">
              <button
                type="button"
                onClick={() => lightbox.open(visible, index)}
                aria-label={`View ${photo.caption || "photograph"} larger`}
                className="relative block w-full cursor-zoom-in overflow-hidden rounded-lg bg-paper-deep"
              >
                <PhotoImage
                  photo={photo}
                  sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full transition-transform duration-500 ease-out group-hover/tile:scale-[1.03]"
                />
                <span
                  aria-hidden
                  className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-paper/85 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover/tile:opacity-100"
                >
                  <Expand className="size-3.5" />
                </span>
              </button>
              <figcaption className="flex items-baseline justify-between gap-3 pt-2.5">
                <Link
                  href={`/photos/${photo.id}`}
                  className="min-w-0 truncate text-sm text-ink/85 underline-offset-4 hover:text-ink hover:underline"
                >
                  {photo.caption || <span className="italic text-muted">Untitled</span>}
                </Link>
                <span
                  className="shrink-0 text-[0.65rem] font-medium uppercase tracking-[0.22em]"
                  style={{ color: info.accentDeep }}
                >
                  {info.label}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </motion.div>
    </div>
  );
}
