import { db } from "@/lib/db";
import type { IntroBackground, Photo, Season } from "@/lib/types";

/** All photos, newest first. Optionally filtered by season. */
export async function getPhotos(season?: Season): Promise<Photo[]> {
  return db.listPhotos(season);
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
