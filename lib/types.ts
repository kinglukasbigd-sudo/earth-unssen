export type Season = "winter" | "spring" | "summer" | "fall";

export interface Photo {
  id: string;
  season: Season;
  caption: string;
  /** Storage-relative path of the image file. */
  imagePath: string;
  /** Fully resolved public URL for the image. */
  imageUrl: string;
  width: number;
  height: number;
  /** Tiny base64 thumbnail used as a blur-up placeholder. */
  blurDataUrl: string;
  /** Higher = displayed first. */
  sortOrder: number;
  /** ISO 8601 upload timestamp. */
  createdAt: string;
}

export interface PhotoDraft {
  season: Season;
  caption: string;
  file: File;
  width: number;
  height: number;
  blurDataUrl: string;
}

export interface PhotoPatch {
  season?: Season;
  caption?: string;
}

/** Configured background for the intro cover (the full-screen flash on entry). */
export interface IntroBackground {
  /** "auto" uses the route's default accent colour. */
  mode: "auto" | "photo" | "color";
  photo: Photo | null;
  color: string | null;
}

/** Per-season studio settings that override the designed defaults. */
export interface SeasonSettings {
  season: Season;
  /** Dedicated photograph behind the season hero, or null to use the cover. */
  hero: Photo | null;
  /** Pinned cover photograph id, or null to use the newest photograph. */
  coverPhotoId: string | null;
  /** Tagline override; null keeps the designed tagline. */
  tagline: string | null;
  /** Editorial description override; null keeps the designed copy. */
  description: string | null;
}
