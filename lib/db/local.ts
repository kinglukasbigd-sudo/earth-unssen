import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  IntroBackground,
  Photo,
  PhotoDraft,
  PhotoPatch,
  Season,
} from "@/lib/types";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const DB_FILE = path.join(process.cwd(), "data", "db.json");

type LocalRecord = Omit<Photo, "imageUrl">;

interface LocalIntroSettings {
  mode: "auto" | "photo" | "color";
  photo: LocalRecord | null;
  color: string | null;
}

interface LocalSettings {
  hero: LocalRecord | null;
  intro: LocalIntroSettings;
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
      settings: {
        hero: parsed.settings?.hero ?? null,
        intro: {
          mode:
            parsed.settings?.intro?.mode === "photo" ||
            parsed.settings?.intro?.mode === "color"
              ? parsed.settings.intro.mode
              : "auto",
          photo: parsed.settings?.intro?.photo ?? null,
          color: parsed.settings?.intro?.color ?? null,
        },
      },
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        photos: [],
        settings: { hero: null, intro: { mode: "auto", photo: null, color: null } },
      };
    }
    console.error("[local-db] failed to read database:", error);
    return {
      photos: [],
      settings: { hero: null, intro: { mode: "auto", photo: null, color: null } },
    };
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

  async getIntroBackground(): Promise<IntroBackground> {
    const { settings } = await readDb();
    const intro = settings.intro;
    return {
      mode: intro.mode,
      photo: intro.mode === "photo" && intro.photo ? toPhoto(intro.photo) : null,
      color: intro.mode === "color" ? intro.color : null,
    };
  },

  async setIntroPhoto(draft: PhotoDraft): Promise<Photo> {
    const id = randomUUID();
    const ext = MIME_EXT[draft.file.type] ?? "jpg";
    const filename = `intro-${id}.${ext}`;

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
    if (settings.intro.photo) {
      await fs
        .unlink(path.join(UPLOADS_DIR, settings.intro.photo.imagePath))
        .catch(() => {});
    }
    settings.intro = { mode: "photo", photo: record, color: null };
    await writeDb(photos, settings);
    return toPhoto(record);
  },

  async setIntroColor(color: string): Promise<void> {
    const { photos, settings } = await readDb();
    if (settings.intro.photo) {
      await fs
        .unlink(path.join(UPLOADS_DIR, settings.intro.photo.imagePath))
        .catch(() => {});
    }
    settings.intro = { mode: "color", photo: null, color };
    await writeDb(photos, settings);
  },

  async clearIntroBackground(): Promise<void> {
    const { photos, settings } = await readDb();
    if (settings.intro.photo) {
      await fs
        .unlink(path.join(UPLOADS_DIR, settings.intro.photo.imagePath))
        .catch(() => {});
    }
    settings.intro = { mode: "auto", photo: null, color: null };
    await writeDb(photos, settings);
  },
};
