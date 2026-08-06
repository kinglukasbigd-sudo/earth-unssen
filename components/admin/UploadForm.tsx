"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ImagePlus, UploadCloud } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import type { Season } from "@/lib/types";
import { compressImage, type CompressedImage } from "@/lib/image/compress";
import { uploadPhotoAction } from "@/lib/actions/admin";
import { Button, Spinner } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type Status = "idle" | "compressing" | "ready" | "uploading";

interface UploadDraft {
  name: string;
  originalSize: number;
  image: CompressedImage;
  previewUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadForm() {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<UploadDraft | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [season, setSeason] = useState<Season>("winter");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [published, setPublished] = useState(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError(null);
    setPublished(false);

    if (!file.type.startsWith("image/")) {
      setError("That file is not an image. Please choose a JPG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is larger than 25 MB. Please choose a smaller file.");
      return;
    }

    setStatus("compressing");
    try {
      const image = await compressImage(file);
      setDraft({
        name: file.name,
        originalSize: file.size,
        image,
        previewUrl: URL.createObjectURL(image.blob),
      });
      setStatus("ready");
    } catch {
      setError(
        "This browser couldn’t open that file. Try a JPG, PNG or WebP instead.",
      );
      setDraft(null);
      setStatus("idle");
    }
  }

  function clearDraft() {
    if (draft) URL.revokeObjectURL(draft.previewUrl);
    setDraft(null);
    setCaption("");
    setStatus("idle");
    setPublished(false);
  }

  async function handleSubmit() {
    if (!draft || !season || status === "uploading") return;
    setError(null);
    setStatus("uploading");

    const formData = new FormData();
    const file = new File([draft.image.blob], "photo.jpg", {
      type: "image/jpeg",
    });
    formData.set("file", file);
    formData.set("season", season);
    formData.set("caption", caption);
    formData.set("width", String(draft.image.width));
    formData.set("height", String(draft.image.height));
    formData.set("blurDataUrl", draft.image.blurDataUrl);

    const result = await uploadPhotoAction(formData);

    if (result.ok && result.photo) {
      toast({
        title: "Photograph published",
        description: "It is now live on the site.",
      });
      setPublished(true);
      setStatus("idle");
      router.refresh();
    } else {
      setError(result.error ?? "Upload failed. Please try again.");
      setStatus("ready");
    }
  }

  const ready = !!draft && status !== "compressing";

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div
          role="button"
          tabIndex={0}
          aria-label="Choose an image to upload"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
            dragOver
              ? "border-ink bg-paper-deep"
              : "border-hairline bg-white/40 hover:border-ink/50 hover:bg-paper-deep/60"
          }`}
        >
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-ink/5 text-ink">
              {status === "compressing" ? (
                <Spinner className="size-5" />
              ) : (
                <ImagePlus className="size-6" strokeWidth={1.5} />
              )}
            </div>
            <p className="mt-4 text-sm font-medium">
              {status === "compressing"
                ? "Optimizing image…"
                : "Drag an image here, or click to browse"}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              JPG, PNG or WebP · optimized automatically on upload
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>

        {error && (
          <p
            className="mt-4 rounded-md border border-[#9c3f2d]/30 bg-[#9c3f2d]/5 px-3.5 py-2.5 text-sm text-[#85352a]"
            role="alert"
          >
            {error}
          </p>
        )}

        {ready && draft && (
          <div className="mt-6 overflow-hidden rounded-xl border border-hairline bg-white/60">
            <div className="relative aspect-[16/9] bg-paper-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.previewUrl}
                alt="Preview of the photograph to upload"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-4 py-3">
              <p className="min-w-0 truncate text-sm font-medium">
                {draft.name}
              </p>
              <p className="shrink-0 text-xs tabular-nums text-muted">
                {draft.image.width}×{draft.image.height} ·{" "}
                {formatBytes(draft.originalSize)} →{" "}
                {formatBytes(draft.image.blob.size)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="rounded-xl border border-hairline bg-white/40 p-6"
        >
          <p className="eyebrow text-muted">New entry</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            Publish a photograph
          </h2>

          <div className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="season"
                className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted"
              >
                Season
              </label>
              <div className="relative">
                <select
                  id="season"
                  value={season}
                  onChange={(e) => setSeason(e.target.value as Season)}
                  className="w-full cursor-pointer appearance-none rounded-md border border-hairline bg-white/70 py-2.5 pl-3.5 pr-9 text-sm outline-none transition-colors focus:border-ink"
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>
                      {seasonInfo(s).label} — {seasonInfo(s).tagline}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 6l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label
                htmlFor="caption"
                className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted"
              >
                Caption
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value.slice(0, 280))}
                rows={4}
                maxLength={280}
                placeholder="Where it was, what the weather was doing…"
                className="w-full resize-none rounded-md border border-hairline bg-white/70 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
              />
              <p className="mt-1 text-right text-xs tabular-nums text-muted">
                {caption.length}/280
              </p>
            </div>

            {published && (
              <div className="flex items-start gap-2.5 rounded-md border border-spring-deep/30 bg-spring-deep/5 px-3.5 py-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-spring-deep" />
                <div className="text-sm">
                  <p className="font-medium">Published.</p>
                  <Link
                    href={`/seasons/${season}`}
                    className="mt-0.5 inline-block text-spring-deep underline underline-offset-2"
                  >
                    View it in {seasonInfo(season).label} →
                  </Link>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!ready || status === "uploading"}
                className="flex-1"
              >
                {status === "uploading" ? (
                  <Spinner className="size-4 text-paper" />
                ) : (
                  <UploadCloud className="size-4" />
                )}
                {status === "uploading" ? "Publishing…" : "Publish"}
              </Button>
              {ready && (
                <Button variant="ghost" type="button" onClick={clearDraft}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
