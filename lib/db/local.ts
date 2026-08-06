import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Photo, PhotoDraft, PhotoPatch, Season } from "@/lib/types";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const DB_FILE = path.join(process.cwd(), "data", "db.json");

type LocalRecord = Omit<Photo, "imageUrl">;

function publicUrl(record: LocalRecord): string {
  return `/uploads/${encodeURIComponent(record.imagePath)}`;
}

function toPhoto(record: LocalRecord): Photo {
  return { ...record, imageUrl: publicUrl(record) };
}

async function readDb(): Promise<LocalRecord[]> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as { photos?: LocalRecord[] };
    return Array.isArray(parsed.photos) ? parsed.photos : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error("[local-db] failed to read database:", error);
    return [];
  }
}

async function writeDb(records: LocalRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify({ photos: records }, null, 2), "utf8");
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
    const records = await readDb();
    const filtered = season
      ? records.filter((r) => r.season === season)
      : records;
    return sortRecords(filtered).map(toPhoto);
  },

  async getPhoto(id: string): Promise<Photo | null> {
    const records = await readDb();
    const record = records.find((r) => r.id === id);
    return record ? toPhoto(record) : null;
  },

  async getLatest(): Promise<Photo | null> {
    const records = sortRecords(await readDb());
    return records[0] ? toPhoto(records[0]) : null;
  },

  async getCover(season: Season): Promise<Photo | null> {
    const records = sortRecords(
      (await readDb()).filter((r) => r.season === season),
    );
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

    const records = await readDb();
    records.push(record);
    await writeDb(records);
    return toPhoto(record);
  },

  async updatePhoto(id: string, patch: PhotoPatch): Promise<Photo | null> {
    const records = await readDb();
    const record = records.find((r) => r.id === id);
    if (!record) return null;
    if (patch.caption !== undefined) record.caption = patch.caption;
    if (patch.season !== undefined) record.season = patch.season;
    await writeDb(records);
    return toPhoto(record);
  },

  async deletePhoto(id: string): Promise<void> {
    const records = await readDb();
    const record = records.find((r) => r.id === id);
    const next = records.filter((r) => r.id !== id);
    if (next.length !== records.length) {
      await writeDb(next);
      if (record) {
        await fs
          .unlink(path.join(UPLOADS_DIR, record.imagePath))
          .catch(() => {});
      }
    }
  },

  /** Persist a new top-to-bottom order (ids already ranked by the caller). */
  async reorderPhotos(orderedIds: string[]): Promise<void> {
    const records = await readDb();
    const byId = new Map(records.map((r) => [r.id, r]));
    const next: LocalRecord[] = [];
    for (const id of orderedIds) {
      const record = byId.get(id);
      if (record) next.push(record);
    }
    next.forEach((record, index) => {
      record.sortOrder = (next.length - index) * 10;
    });
    await writeDb(next);
  },
};
