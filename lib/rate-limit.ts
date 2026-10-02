import { headers } from "next/headers";

const hits = new Map<string, number[]>();

/**
 * Small in-memory sliding-window limiter. Records the attempt and returns
 * false once `limit` attempts were made within `windowMs`. Per server
 * instance — enough to blunt password guessing and form spam.
 */
export function allowAttempt(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  const allowed = recent.length < limit;
  if (allowed) recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (!times.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }
  return allowed;
}

/** Best-effort client IP for rate-limit keys. */
export async function clientIp(): Promise<string> {
  const list = await headers();
  return (
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    list.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
