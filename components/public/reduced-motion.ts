"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/**
 * Hydration-safe reduced-motion preference. Unlike motion's
 * `useReducedMotion()` — `null` on the server but the real value on the
 * client's first render — this reports `false` while hydrating, so the
 * markup matches the server HTML, then re-renders with the real setting
 * (and follows later changes to it).
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
