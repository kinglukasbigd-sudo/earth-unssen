"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { Season } from "@/lib/types";
import {
  LABEL_EASE,
  LIFT_EASE,
  lookForPath,
  TRANSITION_TIMING,
  type TransitionLook,
} from "@/components/public/transition";
import { usePrefersReducedMotion } from "@/components/public/reduced-motion";

/**
 * Route-level transition for client-side navigation. On every route change
 * a full-screen cover (tinted to the destination, e.g. blue for Winter)
 * fades in, the season wordmark rises and holds, then the cover lifts away
 * to reveal the page. The very first paint is handled by <IntroCover />,
 * which uses the same choreography.
 */
export function PageTransition({
  children,
  seasonTaglines,
}: {
  children: React.ReactNode;
  seasonTaglines?: Partial<Record<Season, string>> | null;
}) {
  const pathname = usePathname();
  const reduce = usePrefersReducedMotion();
  const prev = useRef(pathname);
  const [firstPath] = useState(pathname);
  const [active, setActive] = useState(false);
  const [look, setLook] = useState<TransitionLook>(() =>
    lookForPath(pathname ?? "/", seasonTaglines),
  );

  useEffect(() => {
    if (reduce) return;
    if (prev.current === pathname) return;
    prev.current = pathname;
    setLook(lookForPath(pathname ?? "/", seasonTaglines));
    setActive(true);
  }, [pathname, reduce, seasonTaglines]);

  useEffect(() => {
    if (!active || reduce) return;
    const timer = setTimeout(() => setActive(false), TRANSITION_TIMING.solidMs);
    return () => clearTimeout(timer);
  }, [active, reduce]);

  return (
    <>
      {/* Same tree either way, so switching to reduced motion after
          hydration doesn't remount the page. With reduced motion the key
          stays fixed: pages swap in place instead of entering/exiting. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={reduce ? firstPath : pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: "easeIn" } }}
          transition={{ duration: 0.35, ease: LABEL_EASE }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <motion.div
            key={pathname}
            className="fixed inset-0 z-[95] flex origin-top flex-col items-center justify-center"
            style={{ backgroundColor: look.accent }}
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
            <div className="px-6 text-center">
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
    </>
  );
}
