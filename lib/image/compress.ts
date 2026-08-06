export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
  blurDataUrl: string;
}

/** Long edge (px) used when downscaling uploads in the browser. */
export const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.84;
const THUMB_WIDTH = 24;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image file."));
    };
    img.src = url;
  });
}

/**
 * Downscales, re-encodes and strips metadata from a photo in the browser so
 * uploads stay small and the live site stays fast. Also produces a tiny
 * base64 thumbnail used for blur-up placeholders.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const img = await loadImage(file);
  let { width, height } = img;

  if (Math.max(width, height) > MAX_EDGE) {
    const scale = MAX_EDGE / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encoding failed."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  const thumbHeight = Math.max(1, Math.round((THUMB_WIDTH * height) / width));
  const thumb = document.createElement("canvas");
  thumb.width = THUMB_WIDTH;
  thumb.height = thumbHeight;
  const tctx = thumb.getContext("2d");
  if (!tctx) throw new Error("Canvas is not supported in this browser.");
  tctx.drawImage(canvas, 0, 0, THUMB_WIDTH, thumbHeight);
  const blurDataUrl = thumb.toDataURL("image/jpeg", 0.5);

  return { blob, width, height, blurDataUrl };
}
