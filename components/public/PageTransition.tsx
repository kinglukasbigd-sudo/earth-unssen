"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  LABEL_EASE,
  LIFT_EASE,
  lookForPath,
  TRANSITION_TIMING,
  type TransitionLook,
} from "@/components/public/transition";

/**
 * Route-level transition for client-side navigation. On every route change
 * a full-screen cover (tinted to the destination, e.g. blue for Winter)
 * fades in, the season wordmark rises and holds, then the cover lifts away
 * to reveal the page. The very first paint is handled by <IntroCover />,
 * which uses the same choreography.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const prev = useRef(pathname);
  const [active, setActive] = useState(false);
  const [look, setLook] = useState<TransitionLook>(() =>
    lookForPath(pathname ?? "/"),
  );

  useEffect(() => {
    if (reduce) return;
    if (prev.current === pathname) return;
    prev.current = pathname;
    setLook(lookForPath(pathname ?? "/"));
    setActive(true);
  }, [pathname, reduce]);

  useEffect(() => {
    if (!active || reduce) return;
    const timer = setTimeout(() => setActive(false), TRANSITION_TIMING.solidMs);
    return () => clearTimeout(timer);
  }, [active, reduce]);

  return (
    <>
      {children}

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
