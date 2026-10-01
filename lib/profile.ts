import type { Profile } from "@/lib/types";

export const EMPTY_PROFILE: Profile = {
  name: "",
  location: "",
  bio: "",
  email: "",
  instagram: "",
  website: "",
  availability: "",
};

export const PROFILE_LIMITS: Record<keyof Profile, number> = {
  name: 80,
  location: 80,
  bio: 3000,
  email: 254,
  instagram: 200,
  website: 300,
  availability: 160,
};

/** Coerce any stored or submitted value into a complete, trimmed profile. */
export function normalizeProfile(value: unknown): Profile {
  const source =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const profile = { ...EMPTY_PROFILE };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof Profile)[]) {
    const raw = source[key];
    profile[key] =
      typeof raw === "string" ? raw.trim().slice(0, PROFILE_LIMITS[key]) : "";
  }
  return profile;
}

/** Bio split into paragraphs on blank lines. */
export function bioParagraphs(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Full Instagram URL from a handle ("@name", "name") or URL. */
export function instagramUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "");
  return handle ? `https://www.instagram.com/${encodeURIComponent(handle.replace(/\/+$/, ""))}/` : null;
}

/** Display handle for an Instagram value, e.g. "@name". */
export function instagramHandle(value: string): string | null {
  const url = instagramUrl(value);
  if (!url) return null;
  const match = url.match(/instagram\.com\/([^/?#]+)/i);
  return match ? `@${decodeURIComponent(match[1])}` : url;
}

/** Absolute URL for a website value; adds https:// when missing. */
export function websiteUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** Website shown without protocol or trailing slash. */
export function websiteLabel(value: string): string | null {
  const url = websiteUrl(value);
  return url ? url.replace(/^https?:\/\//i, "").replace(/\/$/, "") : null;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
