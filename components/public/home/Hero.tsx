"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type { Variants } from "motion/react";
import type { Photo } from "@/lib/types";
import { PhotoImage } from "@/components/public/PhotoImage";
import { ScrollCue } from "@/components/public/ScrollCue";

interface HeroProps {
  cover: Photo | null;
  background?: Photo | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const textContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

const fadeUp = (y: number, duration: number): Variants => ({
  hidden: { opacity: 0, y },
  show: { opacity: 1, y: 0, transition: { duration, ease: EASE } },
});

const meta: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

const FINE_POINTER_QUERY = "(pointer: fine)";

function subscribeFinePointer(onChange: () => void) {
  const mq = window.matchMedia(FINE_POINTER_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function readFinePointer(): boolean {
  return window.matchMedia(FINE_POINTER_QUERY).matches;
}

export function Hero({ cover, background }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const finePointer = useSyncExternalStore(
    subscribeFinePointer,
    readFinePointer,
    () => false,
  );
  const [cursorActive, setCursorActive] = useState(false);
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const cursorSpringX = useSpring(cursorX, {
    stiffness: 250,
    damping: 20,
    mass: 0.4,
  });
  const cursorSpringY = useSpring(cursorY, {
    stiffness: 250,
    damping: 20,
    mass: 0.4,
  });
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 900], [0, 220]);
  const contentY = useTransform(scrollY, [0, 500], [0, 70]);
  const contentOpacity = useTransform(scrollY, [0, 420], [1, 0]);
  const bg = background ?? cover;

  const enableCursor = finePointer && !reduce;

  function handleMouseEnter() {
    if (enableCursor) setCursorActive(true);
  }

  function handleMouseMove(event: MouseEvent<HTMLElement>) {
    if (!enableCursor) return;
    cursorX.set(event.clientX);
    cursorY.set(event.clientY);
  }

  function handleMouseLeave() {
    setCursorActive(false);
  }

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink"
      style={{ cursor: enableCursor ? "none" : undefined }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {enableCursor && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[60] -ml-5 -mt-5 size-10"
          style={{ x: cursorSpringX, y: cursorSpringY }}
          animate={{ opacity: cursorActive ? 1 : 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          <div className="absolute inset-0 rounded-full border border-paper/40" />
          <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-paper/70" />
          <span className="absolute bottom-0 left-1/2 h-1.5 w-px -translate-x-1/2 bg-paper/70" />
          <span className="absolute left-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-paper/70" />
          <span className="absolute right-0 top-1/2 h-px w-1.5 -translate-y-1/2 bg-paper/70" />
        </motion.div>
      )}

      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        {bg ? (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ scale: 1.06 }}
            transition={{
              duration: 18,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
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
        variants={textContainer}
        initial="hidden"
        animate="show"
      >
        <motion.p
          className="eyebrow text-paper/75"
          variants={fadeUp(14, 0.7)}
        >
          Landscape &amp; wildlife — photographed in the field
        </motion.p>

        <motion.h1
          className="mt-6 font-display text-hero text-paper"
          variants={fadeUp(36, 0.8)}
        >
          Earth
          <span className="block italic text-paper/90">Unseen</span>
        </motion.h1>

        <motion.p
          className="mt-8 max-w-md text-base leading-relaxed text-paper/80 sm:text-lg"
          variants={fadeUp(20, 0.7)}
        >
          A year of the natural world, photographed close to home. Four
          seasons, collected here as they unfold — quiet mornings, wild
          places, and the animals that share them.
        </motion.p>

        <motion.p
          className="mt-8 text-xs uppercase tracking-[0.25em] text-paper/50"
          variants={meta}
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
