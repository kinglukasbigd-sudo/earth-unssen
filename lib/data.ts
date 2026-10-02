import { db } from "@/lib/db";
import type {
  IntroBackground,
  Photo,
  Profile,
  Season,
  SeasonSettings,
} from "@/lib/types";

/** All photos, newest first. Optionally filtered by season. */
export async function getPhotos(season?: Season): Promise<Photo[]> {
  return db.listPhotos(season);
}

/** Studio overrides for a single season (hero, cover, text). */
export async function getSeasonSettings(season: Season): Promise<SeasonSettings> {
  return db.getSeasonSettings(season);
}

/** Studio overrides for every season, in canonical order. */
export async function getAllSeasonSettings(): Promise<SeasonSettings[]> {
  return db.getAllSeasonSettings();
}

/** A curated set of the latest photos across all seasons. */
export async function getFeaturedPhotos(limit = 6): Promise<Photo[]> {
  return (await db.listPhotos()).slice(0, limit);
}

export async function getLatestPhoto(): Promise<Photo | null> {
  return db.getLatest();
}

export async function getCoverPhoto(season: Season): Promise<Photo | null> {
  return db.getCover(season);
}

/** Explicitly configured start-screen background, or null to use the default. */
export async function getHeroBackground(): Promise<Photo | null> {
  return db.getHeroBackground();
}

/** Configured intro-cover background (photo, colour, or automatic). */
export async function getIntroBackground(): Promise<IntroBackground> {
  return db.getIntroBackground();
}

export async function getSeasonCounts(): Promise<Record<Season, number>> {
  const all = await db.listPhotos();
  const counts: Record<Season, number> = {
    winter: 0,
    spring: 0,
    summer: 0,
    fall: 0,
  };
  for (const photo of all) counts[photo.season] += 1;
  return counts;
}

/** The photographer's public profile (name, bio, contact links). */
export async function getProfile(): Promise<Profile> {
  return db.getProfile();
}

/** A single photograph by id, or null if it doesn't exist. */
export async function getPhoto(id: string): Promise<Photo | null> {
  return db.getPhoto(id);
}
