import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Photo, PhotoDraft, PhotoPatch, Season } from "@/lib/types";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const DB_FILE = path.join(process.cwd(), "data", "db.json");

type LocalRecord = Omit<Photo, "imageUrl">;

interface LocalSettings {
  hero: LocalRecord | null;
}

function publicUrl(record: LocalRecord): string {
  return `/uploads/${encodeURIComponent(record.imagePath)}`;
}

function toPhoto(record: LocalRecord): Photo {
  return { ...record, imageUrl: publicUrl(record) };
}

async function readDb(): Promise<{
  photos: LocalRecord[];
  settings: LocalSettings;
}> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as {
      photos?: LocalRecord[];
      settings?: Partial<LocalSettings>;
    };
    return {
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
      settings: { hero: parsed.settings?.hero ?? null },
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { photos: [], settings: { hero: null } };
    }
    console.error("[local-db] failed to read database:", error);
    return { photos: [], settings: { hero: null } };
  }
}

async function writeDb(
  photos: LocalRecord[],
  settings: LocalSettings,
): Promise<void> {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ photos, settings }, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

function sortRecords(records: LocalRecord[]): LocalRecord[] {
  return [...records].sort(
    (a, b) =>
      b.sortOrder - a.sortOrder ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export const localDb = {
  async listPhotos(season?: Season): Promise<Photo[]> {
    const { photos } = await readDb();
    const filtered = season
      ? photos.filter((r) => r.season === season)
      : photos;
    return sortRecords(filtered).map(toPhoto);
  },

  async getPhoto(id: string): Promise<Photo | null> {
    const { photos } = await readDb();
    const record = photos.find((r) => r.id === id);
    return record ? toPhoto(record) : null;
  },

  async getLatest(): Promise<Photo | null> {
    const { photos } = await readDb();
    const records = sortRecords(photos);
    return records[0] ? toPhoto(records[0]) : null;
  },

  async getCover(season: Season): Promise<Photo | null> {
    const { photos } = await readDb();
    const records = sortRecords(photos.filter((r) => r.season === season));
    return records[0] ? toPhoto(records[0]) : null;
  },

  async createPhoto(draft: PhotoDraft): Promise<Photo> {
    const id = randomUUID();
    const ext = MIME_EXT[draft.file.type] ?? "jpg";
    const filename = `${id}.${ext}`;

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(
      path.join(UPLOADS_DIR, filename),
      Buffer.from(await draft.file.arrayBuffer()),
    );

    const now = new Date().toISOString();
    const record: LocalRecord = {
      id,
      season: draft.season,
      caption: draft.caption,
      imagePath: filename,
      width: draft.width,
      height: draft.height,
      blurDataUrl: draft.blurDataUrl,
      sortOrder: Date.now(),
      createdAt: now,
    };

    const { photos, settings } = await readDb();
    photos.push(record);
    await writeDb(photos, settings);
    return toPhoto(record);
  },

  async updatePhoto(id: string, patch: PhotoPatch): Promise<Photo | null> {
    const { photos, settings } = await readDb();
    const record = photos.find((r) => r.id === id);
    if (!record) return null;
    if (patch.caption !== undefined) record.caption = patch.caption;
    if (patch.season !== undefined) record.season = patch.season;
    await writeDb(photos, settings);
    return toPhoto(record);
  },

  async deletePhoto(id: string): Promise<void> {
    const { photos, settings } = await readDb();
    const record = photos.find((r) => r.id === id);
    const next = photos.filter((r) => r.id !== id);
    if (next.length !== photos.length) {
      await writeDb(next, settings);
      if (record) {
        await fs
          .unlink(path.join(UPLOADS_DIR, record.imagePath))
          .catch(() => {});
      }
    }
  },

  /** Persist a new top-to-bottom order (ids already ranked by the caller). */
  async reorderPhotos(orderedIds: string[]): Promise<void> {
    const { photos, settings } = await readDb();
    const byId = new Map(photos.map((r) => [r.id, r]));
    const next: LocalRecord[] = [];
    for (const id of orderedIds) {
      const record = byId.get(id);
      if (record) next.push(record);
    }
    next.forEach((record, index) => {
      record.sortOrder = (next.length - index) * 10;
    });
    await writeDb(next, settings);
  },

  async getHeroBackground(): Promise<Photo | null> {
    const { settings } = await readDb();
    return settings.hero ? toPhoto(settings.hero) : null;
  },

  async setHeroBackground(draft: PhotoDraft): Promise<Photo> {
    const id = randomUUID();
    const ext = MIME_EXT[draft.file.type] ?? "jpg";
    const filename = `hero-${id}.${ext}`;

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(
      path.join(UPLOADS_DIR, filename),
      Buffer.from(await draft.file.arrayBuffer()),
    );

    const record: LocalRecord = {
      id,
      season: "winter",
      caption: "",
      imagePath: filename,
      width: draft.width,
      height: draft.height,
      blurDataUrl: draft.blurDataUrl,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
    };

    const { photos, settings } = await readDb();
    if (settings.hero) {
      await fs
        .unlink(path.join(UPLOADS_DIR, settings.hero.imagePath))
        .catch(() => {});
    }
    settings.hero = record;
    await writeDb(photos, settings);
    return toPhoto(record);
  },

  async clearHeroBackground(): Promise<void> {
    const { photos, settings } = await readDb();
    if (settings.hero) {
      await fs
        .unlink(path.join(UPLOADS_DIR, settings.hero.imagePath))
        .catch(() => {});
    }
    settings.hero = null;
    await writeDb(photos, settings);
  },
};
