"use client";

import { useRef } from "react";
import type { MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

interface MagneticProps {
  children: React.ReactNode;
  /** Max pull from centre in pixels. */
  strength?: number;
  className?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Subtle magnetic pull toward the cursor — transforms only, a few pixels
 * max, spring-smoothed so it feels soft rather than mechanical. A no-op on
 * touch devices and for reduced-motion users (the global MotionConfig
 * already disables transform animations there).
 */
export function Magnetic({
  children,
  strength = 4,
  className,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 30, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 300, damping: 30, mass: 0.6 });

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    x.set(clamp(dx * 0.15, -strength, strength));
    y.set(clamp(dy * 0.15, -strength, strength));
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x: sx, y: sy }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}
