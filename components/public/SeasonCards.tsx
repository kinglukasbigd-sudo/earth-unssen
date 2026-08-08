"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import type { Photo, Season } from "@/lib/types";
import { PhotoImage } from "@/components/public/PhotoImage";

interface SeasonCardsProps {
  covers: Partial<Record<Season, Photo | null>>;
  counts: Record<Season, number>;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  hover: {
    y: -3,
    boxShadow: "0 20px 40px -20px rgba(0,0,0,0.25)",
    transition: { duration: 0.4, ease: EASE },
  },
};

const image: Variants = {
  hover: { scale: 1.04, transition: { duration: 0.4, ease: EASE } },
};

export function SeasonCards({ covers, counts }: SeasonCardsProps) {
  return (
    <motion.div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {SEASONS.map((season) => {
        const info = seasonInfo(season);
        const cover = covers[season] ?? null;
        const count = counts[season];

        return (
          <motion.div
            key={season}
            className="group relative block overflow-hidden rounded-lg"
            style={{ backgroundColor: info.accentSoft }}
            variants={card}
            whileHover="hover"
          >
            <Link href={`/seasons/${season}`} className="block h-full">
              <div className="relative aspect-[4/5] w-full">
                {cover ? (
                  <motion.div className="absolute inset-0" variants={image}>
                    <PhotoImage
                      photo={cover}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </motion.div>
                ) : (
                  <div
                    aria-hidden
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(120% 90% at 20% 10%, ${info.accentSoft} 0%, ${info.moodBg} 100%)`,
                    }}
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent transition-opacity duration-500 group-hover:opacity-90"
                />

                <div className="absolute inset-0 flex flex-col justify-end p-5 text-paper sm:p-6">
                  <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-paper/65">
                    {count} {count === 1 ? "photograph" : "photographs"}
                  </p>
                  <h3 className="mt-1 font-display text-3xl tracking-tight sm:text-[2rem]">
                    {info.label}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-paper/75 sm:text-sm">
                    {info.blurb}
                  </p>
                </div>

                <span
                  aria-hidden
                  className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-paper/15 text-paper opacity-0 backdrop-blur-sm transition-all duration-400 group-hover:opacity-100"
                >
                  <ArrowUpRight className="size-4" />
                </span>

                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ backgroundColor: info.accent }}
                />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
