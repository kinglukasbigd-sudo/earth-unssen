import type { Season } from "@/lib/types";
import { accentForPath, SEASON_INFO } from "@/lib/seasons";

/** Slow, deliberate easings used across the entrance covers. */
export const LIFT_EASE = [0.83, 0, 0.17, 1] as const;
export const LABEL_EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Shared choreography for the page entrance: the cover fades in, the
 * wordmark fades in and holds, then fades out and the cover lifts away.
 */
export const TRANSITION_TIMING = {
  /** Fade the solid cover in. */
  coverIn: 0.25,
  /** Delay before the wordmark appears. */
  labelInDelay: 0.12,
  /** Wordmark rise-in duration. */
  labelIn: 0.55,
  /** Total time the cover stays solid (cover + label + hold). */
  solidMs: 1200,
  /** Wordmark fade-out duration. */
  labelOut: 0.3,
  /** Pause between the wordmark leaving and the cover lifting. */
  liftDelay: 0.35,
  /** The cover lift itself. */
  lift: 0.9,
} as const;

export interface TransitionLook {
  accent: string;
  label: string;
  sub: string;
}

/** The wordmark (and its colour) for a given route. */
export function lookForPath(
  pathname: string,
  seasonTaglines?: Partial<Record<Season, string>> | null,
): TransitionLook {
  const match = pathname.match(/^\/seasons\/(winter|spring|summer|fall)$/);
  if (match) {
    const season = match[1] as Season;
    return {
      accent: SEASON_INFO[season].accent,
      label: SEASON_INFO[season].label,
      sub: seasonTaglines?.[season] ?? SEASON_INFO[season].tagline,
    };
  }
  return {
    accent: accentForPath(pathname) ?? "#191713",
    label: "Earth Unseen",
    sub: "Photographed in the field",
  };
}
