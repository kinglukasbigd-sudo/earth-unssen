"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import type { Photo } from "@/lib/types";
import { PhotoImage } from "@/components/public/PhotoImage";
import { ScrollCue } from "@/components/public/ScrollCue";

interface HeroProps {
  cover: Photo | null;
  background?: Photo | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({ cover, background }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 900], [0, 220]);
  const contentY = useTransform(scrollY, [0, 500], [0, 70]);
  const contentOpacity = useTransform(scrollY, [0, 420], [1, 0]);
  const bg = background ?? cover;

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink"
    >
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        {bg ? (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.2, ease: EASE }}
          >
            <PhotoImage
              photo={bg}
              fill
              priority
              sizes="100vw"
              quality={80}
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(130% 100% at 50% 0%, #22313f 0%, #17110d 55%, #120d09 100%)",
            }}
          />
        )}

        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-ink/45 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-paper via-paper/20 to-transparent"
        />
      </motion.div>

      <motion.div
        className="container-site relative pb-24 pt-40 sm:pb-28"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <motion.p
          className="eyebrow text-paper/75"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
        >
          Landscape &amp; wildlife — photographed in the field
        </motion.p>

        <motion.h1
          className="mt-6 font-display text-hero text-paper"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.8, ease: EASE }}
        >
          Earth
          <span className="block italic text-paper/90">Unseen</span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-md text-base leading-relaxed text-paper/80 sm:text-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
        >
          A year of the natural world, photographed close to home. Four
          seasons, collected here as they unfold — quiet mornings, wild
          places, and the animals that share them.
        </motion.p>

        <motion.p
          className="mt-8 text-xs uppercase tracking-[0.25em] text-paper/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.6 }}
        >
          Est. 2026 · Shot on camera &amp; phone
        </motion.p>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <ScrollCue />
      </div>
    </section>
  );
}
