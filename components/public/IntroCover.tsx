"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import type { IntroBackground, Season } from "@/lib/types";
import {
  LABEL_EASE,
  LIFT_EASE,
  lookForPath,
  TRANSITION_TIMING,
} from "@/components/public/transition";
import { usePrefersReducedMotion } from "@/components/public/reduced-motion";

/**
 * Full-screen cover shown on the very first paint. It matches the
 * in-page transition (see PageTransition): the wordmark fades in, holds,
 * then the cover lifts away to reveal the page — a composed, editorial
 * entrance on every cold load. The background can be a configured photo,
 * a configured colour, or the route's default accent.
 */
export function IntroCover({
  background,
  seasonTaglines,
}: {
  background: IntroBackground;
  seasonTaglines?: Partial<Record<Season, string>> | null;
}) {
  const pathname = usePathname();
  const reduce = usePrefersReducedMotion();
  const [show, setShow] = useState(true);
  const look = lookForPath(pathname ?? "/", seasonTaglines);
  const photo = background.mode === "photo" ? background.photo : null;
  const bgColor =
    background.mode === "color" && background.color
      ? background.color
      : look.accent;

  useEffect(() => {
    if (reduce) return;
    const timer = setTimeout(() => setShow(false), TRANSITION_TIMING.solidMs);
    return () => clearTimeout(timer);
  }, [reduce]);

  if (reduce) return null;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            id="intro-cover"
            className="fixed inset-0 z-[96] flex origin-top flex-col items-center justify-center overflow-hidden"
            style={{ backgroundColor: bgColor }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: TRANSITION_TIMING.coverIn, ease: "easeOut" },
            }}
            exit={{
              scaleY: 0,
              transition: {
                duration: TRANSITION_TIMING.lift,
                ease: LIFT_EASE,
                delay: TRANSITION_TIMING.liftDelay,
              },
            }}
          >
            {photo && (
              <>
                <div className="absolute inset-0">
                  <Image
                    src={photo.imageUrl}
                    alt=""
                    fill
                    sizes="100vw"
                    priority
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={photo.blurDataUrl}
                  />
                </div>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-ink/45"
                />
              </>
            )}
            <div className="relative px-6 text-center">
              <motion.p
                className="font-display text-4xl tracking-tight text-paper sm:text-6xl"
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: TRANSITION_TIMING.labelIn,
                    delay: TRANSITION_TIMING.labelInDelay,
                    ease: LABEL_EASE,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: -14,
                  transition: { duration: TRANSITION_TIMING.labelOut, ease: "easeIn" },
                }}
              >
                {look.label}
              </motion.p>
              <motion.p
                className="mt-4 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-paper/70"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: {
                    duration: 0.4,
                    delay: TRANSITION_TIMING.labelInDelay + 0.25,
                  },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: TRANSITION_TIMING.labelOut },
                }}
              >
                {look.sub}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <noscript>
        <style>{"#intro-cover{display:none}"}</style>
      </noscript>
    </>
  );
}
