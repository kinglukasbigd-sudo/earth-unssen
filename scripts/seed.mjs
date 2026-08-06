/**
 * Seed the local backend with a real photograph so the site can be
 * previewed end-to-end before any photos are uploaded through the admin.
 *
 * Usage:
 *   node scripts/seed.mjs --file /path/to/photo.jpg [--season summer] [--caption "..."]
 *
 * The file is downscaled (long edge 2048px, JPEG) with a blur-up
 * placeholder generated, exactly like the in-browser upload pipeline.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const DB_FILE = path.join(process.cwd(), "data", "db.json");
const MAX_EDGE = 2048;
const SEASONS = ["winter", "spring", "summer", "fall"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key.startsWith("--")) args[key.slice(2)] = argv[i + 1];
  }
  return args;
}

async function main() {
  const { file, season = "summer", caption = "" } = parseArgs(process.argv.slice(2));

  if (!file) {
    console.error(
      "Usage: node scripts/seed.mjs --file /path/to/photo.jpg [--season winter|spring|summer|fall] [--caption \"…\"]",
    );
    process.exit(1);
  }
  if (!SEASONS.includes(season)) {
    console.error(`Season must be one of: ${SEASONS.join(", ")}`);
    process.exit(1);
  }

  const source = path.resolve(file);
  const image = sharp(source);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    console.error("Could not read image dimensions.");
    process.exit(1);
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(metadata.width, metadata.height));
  const width = Math.round(metadata.width * scale);
  const height = Math.round(metadata.height * scale);

  const processed = await image
    .rotate()
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84 })
    .toBuffer();

  const thumbWidth = 24;
  const thumbHeight = Math.max(1, Math.round((thumbWidth * height) / width));
  const thumb = await image
    .rotate()
    .resize(thumbWidth, thumbHeight, { fit: "inside" })
    .jpeg({ quality: 50 })
    .toBuffer();
  const blurDataUrl = `data:image/jpeg;base64,${thumb.toString("base64")}`;

  const id = randomUUID();
  const filename = `${id}.jpg`;

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), processed);

  let photos = [];
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    photos = JSON.parse(raw).photos ?? [];
  } catch {
    /* fresh database */
  }

  photos.push({
    id,
    season,
    caption,
    imagePath: filename,
    width,
    height,
    blurDataUrl,
    sortOrder: Date.now(),
    createdAt: new Date().toISOString(),
  });

  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify({ photos }, null, 2));

  console.log(`Seeded ${filename} → season "${season}"`);
  console.log(`${width}×${height} · ${(processed.length / 1024).toFixed(0)} KB`);
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
