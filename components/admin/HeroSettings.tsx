"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, RefreshCcw } from "lucide-react";
import type { Photo } from "@/lib/types";
import { compressImage } from "@/lib/image/compress";
import {
  clearHeroBackgroundAction,
  setHeroBackgroundAction,
} from "@/lib/actions/admin";
import { Button, ConfirmDialog, Spinner } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type Status = "idle" | "compressing" | "saving";

export function HeroSettings({
  initialBackground,
}: {
  initialBackground: Photo | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [background, setBackground] = useState<Photo | null>(initialBackground);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("That file is not an image. Please choose a JPG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("That image is larger than 25 MB. Please choose a smaller file.");
      return;
    }

    setStatus("compressing");
    let image: { blob: Blob; width: number; height: number; blurDataUrl: string };
    try {
      image = await compressImage(file);
    } catch {
      setError("This browser couldn’t open that file. Try a JPG, PNG or WebP instead.");
      setStatus("idle");
      return;
    }

    setStatus("saving");
    const formData = new FormData();
    formData.set("file", new File([image.blob], "background.jpg", { type: "image/jpeg" }));
    formData.set("width", String(image.width));
    formData.set("height", String(image.height));
    formData.set("blurDataUrl", image.blurDataUrl);

    const result = await setHeroBackgroundAction(formData);
    setStatus("idle");

    if (result.ok && result.photo) {
      setBackground(result.photo);
      toast({
        title: "Background saved",
        description: "The start screen is using the new image.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not save the new background.");
    }
  }

  async function handleClear() {
    setStatus("saving");
    const result = await clearHeroBackgroundAction();
    setStatus("idle");
    setConfirmClear(false);
    if (result.ok) {
      setBackground(null);
      toast({
        title: "Background reset",
        description: "The start screen now uses your newest photograph.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not reset the background.");
    }
  }

  const busy = status === "compressing" || status === "saving";

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-xl border border-hairline bg-white/60">
          <div className="relative aspect-[16/9] bg-paper-deep">
            {background ? (
              <Image
                src={background.imageUrl}
                alt="Current start-screen background"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority
                quality={80}
                placeholder="blur"
                blurDataURL={background.blurDataUrl}
                className="object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 grid place-items-center"
                style={{
                  background:
                    "radial-gradient(130% 100% at 50% 0%, #22313f 0%, #17110d 55%, #120d09 100%)",
                }}
              >
                <div className="px-6 text-center">
                  <p className="font-display text-2xl tracking-tight text-paper">
                    Earth <span className="italic opacity-70">Unseen</span>
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-paper/50">
                    Automatic background
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3">
            <p className="text-sm text-muted">
              {background ? (
                <>
                  Your background is set.{" "}
                  <span className="text-ink">
                    {background.width}×{background.height}
                  </span>
                </>
              ) : (
                <>
                  No background set — the start screen uses{" "}
                  <span className="text-ink">your newest photograph</span>.
                </>
              )}
            </p>
            {background && (
              <Button
                variant="ghost"
                onClick={() => setConfirmClear(true)}
                disabled={busy}
                className="px-3 py-2 text-xs"
              >
                <RefreshCcw className="size-3.5" />
                Reset to automatic
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p
            className="mt-4 rounded-md border border-[#9c3f2d]/30 bg-[#9c3f2d]/5 px-3.5 py-2.5 text-sm text-[#85352a]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-xl border border-hairline bg-white/40 p-6">
          <p className="eyebrow text-muted">Change background</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            Pick a photograph
          </h2>

          <div
            role="button"
            tabIndex={0}
            aria-label="Choose an image for the start screen"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="mt-6 grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-hairline bg-white/40 px-6 py-10 text-center transition-colors hover:border-ink/50 hover:bg-paper-deep/60"
          >
            <div>
              <div className="mx-auto grid size-11 place-items-center rounded-full bg-ink/5 text-ink">
                {busy ? (
                  <Spinner className="size-5" />
                ) : (
                  <ImagePlus className="size-5" strokeWidth={1.5} />
                )}
              </div>
              <p className="mt-3 text-sm font-medium">
                {busy ? "Saving…" : "Drag an image here, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-muted">
                JPG, PNG or WebP · optimized automatically
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

          <p className="mt-5 text-xs leading-relaxed text-muted">
            The image is downscaled and re-encoded in your browser before it
            is stored — the design, text and animations on the opening screen
            are untouched.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Reset the start-screen background?"
        body="The opening screen will go back to using your newest photograph automatically."
        confirmLabel="Reset"
        pending={status === "saving"}
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
