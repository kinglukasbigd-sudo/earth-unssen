"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Expand } from "lucide-react";
import type { Photo } from "@/lib/types";
import { seasonInfo } from "@/lib/seasons";
import { useLightbox } from "@/components/public/lightbox";
import { PhotoImage } from "@/components/public/PhotoImage";

interface PhotoEntryProps {
  photo: Photo;
  index: number;
  total: number;
  photos: Photo[];
  sizes?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * A single blog-style entry: image with hover treatment, caption below.
 */
export function PhotoEntry({
  photo,
  index,
  total,
  photos,
  sizes = "(min-width: 960px) 60rem, 100vw",
}: PhotoEntryProps) {
  const lightbox = useLightbox();
  const info = seasonInfo(photo.season);

  return (
    <article className="group/entry">
      <motion.button
        type="button"
        onClick={() => lightbox.open(photos, index)}
        aria-label={`View ${photo.caption || `photograph ${index + 1}`}`}
        className="relative block w-full cursor-zoom-in overflow-hidden rounded-lg bg-paper-deep"
        whileHover={{ boxShadow: "0 30px 60px -30px rgba(0,0,0,0.28)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative aspect-[4/3] w-full">
          <motion.div
            className="absolute inset-0"
            initial={false}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <PhotoImage
              photo={photo}
              fill
              sizes={sizes}
              quality={82}
              className="object-cover"
            />
          </motion.div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition-opacity duration-500 group-hover/entry:opacity-100" />

        <span
          aria-hidden
          className="absolute right-3 top-3 grid size-9 translate-y-1 place-items-center rounded-full bg-paper/85 text-ink opacity-0 backdrop-blur-sm transition-all duration-400 group-hover/entry:translate-y-0 group-hover/entry:opacity-100"
        >
          <Expand className="size-4" />
        </span>
      </motion.button>

      <div className="flex flex-col gap-2 pt-5 pb-2">
        <p className="font-display text-xl leading-snug sm:text-2xl">
          <Link
            href={`/photos/${photo.id}`}
            className="decoration-1 underline-offset-[6px] hover:underline"
          >
            {photo.caption || <span className="italic text-muted">Untitled</span>}
          </Link>
        </p>
        <div className="flex items-baseline justify-between gap-4 text-xs text-muted">
          <span className="uppercase tracking-[0.22em]">
            <span style={{ color: info.accentDeep }}>{info.label}</span>
            <span aria-hidden className="mx-2">·</span>
            No. {String(index + 1).padStart(2, "0")}
            <span aria-hidden className="mx-2">/</span>
            {String(total).padStart(2, "0")}
          </span>
          <span className="shrink-0 tabular-nums">{formatDate(photo.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}
