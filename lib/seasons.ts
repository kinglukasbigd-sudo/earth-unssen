import type { Season, SeasonSettings } from "@/lib/types";

export const SEASONS: Season[] = ["winter", "spring", "summer", "fall"];

export interface SeasonInfo {
  slug: Season;
  label: string;
  /** One-line mood, used on nav cards and hero eyebrows. */
  blurb: string;
  /** Primary accent colour. */
  accent: string;
  /** Deeper accent for text on light surfaces. */
  accentDeep: string;
  /** Very soft tint used for tints, chips, and page moods. */
  accentSoft: string;
  /** Background wash for the page (subtle seasonal mood). */
  moodBg: string;
  /** Longer editorial paragraph shown in the season hero. */
  description: string;
  /** A short poetic tagline. */
  tagline: string;
}

export const SEASON_INFO: Record<Season, SeasonInfo> = {
  winter: {
    slug: "winter",
    label: "Winter",
    blurb: "Quiet light, bare trees, and the hush of short days.",
    accent: "#6E93B3",
    accentDeep: "#3F5C74",
    accentSoft: "#E8F0F6",
    moodBg: "#F2F6F9",
    description:
      "The landscape withdraws, and what remains is drawn in charcoal and frost. Mornings arrive pale and silver; evenings shut down early over blue drifts of snow. It is a season that asks to be watched slowly.",
    tagline: "Snow, frost & the first thaw",
  },
  spring: {
    slug: "spring",
    label: "Spring",
    blurb: "New growth, returning birds, and long golden evenings.",
    accent: "#84985F",
    accentDeep: "#54673A",
    accentSoft: "#ECF0E3",
    moodBg: "#F4F6EF",
    description:
      "The melt begins, then the bloom. Bare hedges fill with green, migrant birds arrive on schedule, and the evenings stretch further than they have in months. Spring is the season of return — in the woods and in the light.",
    tagline: "Melt, bloom, return",
  },
  summer: {
    slug: "summer",
    label: "Summer",
    blurb: "Haze on the hills, wildflower meadows, and storm-light.",
    accent: "#C79A3B",
    accentDeep: "#8F6B1D",
    accentSoft: "#F8F0DB",
    moodBg: "#FBF6E9",
    description:
      "High sun and long days. Fields of wildflower bake in the afternoon, rivers run low and clear, and the year’s storms stack purple on the horizon. Everything moves slower, then all at once.",
    tagline: "High sun & long days",
  },
  fall: {
    slug: "fall",
    label: "Fall",
    blurb: "Amber woods, migrating flocks, and the season of colour.",
    accent: "#A85C38",
    accentDeep: "#7B3F22",
    accentSoft: "#F4E7DD",
    moodBg: "#F9F0E7",
    description:
      "The year turns chromatic. Beech and maple burn through gold to rust, geese trace their long V's overhead, and low sun rakes across every ridge. Fall is brief, and it knows it.",
    tagline: "Foliage & last light",
  },
};

export function seasonInfo(season: Season): SeasonInfo {
  return SEASON_INFO[season];
}

/**
 * The season's copy as shown on the site, falling back to the designed
 * default whenever a studio override is empty.
 */
export function resolveSeasonInfo(
  season: Season,
  settings?: Pick<SeasonSettings, "tagline" | "description"> | null,
): SeasonInfo {
  const info = SEASON_INFO[season];
  const tagline = settings?.tagline?.trim();
  const description = settings?.description?.trim();
  return {
    ...info,
    tagline: tagline ? tagline : info.tagline,
    description: description ? description : info.description,
  };
}

/** Returns the accent colour associated with a route path, if any. */
export function accentForPath(pathname: string): string | null {
  if (pathname === "/") return "#191713";
  if (pathname === "/about") return "#191713";
  if (pathname.startsWith("/admin")) return "#191713";
  const match = pathname.match(/^\/seasons\/(winter|spring|summer|fall)$/);
  if (match) return SEASON_INFO[match[1] as Season].accent;
  return "#191713";
}

export const NEXT_SEASON: Record<Season, Season> = {
  winter: "spring",
  spring: "summer",
  summer: "fall",
  fall: "winter",
};

export const PREV_SEASON: Record<Season, Season> = {
  winter: "fall",
  spring: "winter",
  summer: "spring",
  fall: "summer",
};
