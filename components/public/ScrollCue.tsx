"use client";

import { motion } from "motion/react";

export function ScrollCue() {
  return (
    <motion.div
      className="flex flex-col items-center gap-3 text-paper/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.3, duration: 0.8 }}
      aria-hidden
    >
      <span className="eyebrow text-[0.6rem]">Scroll</span>
      <motion.span
        className="block h-12 w-px bg-current"
        animate={{ scaleY: [1, 0.35, 1], transformOrigin: "top" }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
