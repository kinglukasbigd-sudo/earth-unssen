"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImagePlus, Palette, RefreshCcw } from "lucide-react";
import type { IntroBackground } from "@/lib/types";
import { accentForPath } from "@/lib/seasons";
import { compressImage } from "@/lib/image/compress";
import {
  clearIntroBackgroundAction,
  setIntroColorAction,
  setIntroPhotoAction,
} from "@/lib/actions/admin";
import { Button, ConfirmDialog, Spinner } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const DEFAULT_ACCENT = accentForPath("/") ?? "#191713";

type Status = "idle" | "uploading" | "saving";

export function IntroSettings({ initial }: { initial: IntroBackground }) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [intro, setIntro] = useState<IntroBackground>(initial);
  const [colorDraft, setColorDraft] = useState<string>(
    initial.mode === "color" ? (initial.color ?? DEFAULT_ACCENT) : DEFAULT_ACCENT,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const photo = intro.mode === "photo" ? intro.photo : null;
  const previewColor =
    intro.mode === "color" ? (intro.color ?? DEFAULT_ACCENT) : DEFAULT_ACCENT;

  async function handlePhoto(file: File | undefined | null) {
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

    setStatus("uploading");
    let image: { blob: Blob; width: number; height: number; blurDataUrl: string };
    try {
      image = await compressImage(file);
    } catch {
      setError("This browser couldn’t open that file. Try a JPG, PNG or WebP instead.");
      setStatus("idle");
      return;
    }

    const formData = new FormData();
    formData.set("file", new File([image.blob], "intro.jpg", { type: "image/jpeg" }));
    formData.set("width", String(image.width));
    formData.set("height", String(image.height));
    formData.set("blurDataUrl", image.blurDataUrl);

    const result = await setIntroPhotoAction(formData);
    setStatus("idle");

    if (result.ok && result.photo) {
      setIntro({ mode: "photo", photo: result.photo, color: null });
      setColorDraft(DEFAULT_ACCENT);
      toast({
        title: "Intro cover saved",
        description: "The opening screen now uses this photograph.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not save the new intro cover.");
    }
  }

  async function handleColor() {
    setError(null);
    setStatus("saving");
    const result = await setIntroColorAction(colorDraft);
    setStatus("idle");

    if (result.ok) {
      setIntro({ mode: "color", photo: null, color: colorDraft.toLowerCase() });
      toast({
        title: "Colour saved",
        description: "The opening screen now uses this colour.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not save the colour.");
    }
  }

  async function handleClear() {
    setStatus("saving");
    const result = await clearIntroBackgroundAction();
    setStatus("idle");
    setConfirmClear(false);

    if (result.ok) {
      setIntro({ mode: "auto", photo: null, color: null });
      setColorDraft(DEFAULT_ACCENT);
      toast({
        title: "Intro cover reset",
        description: "It now uses the site’s automatic colours.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not reset the intro cover.");
    }
  }

  const busy = status === "uploading" || status === "saving";

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-xl border border-hairline bg-white/60">
          <div
            className="relative aspect-video overflow-hidden"
            style={{ backgroundColor: previewColor }}
          >
            {photo && (
              <>
                <Image
                  src={photo.imageUrl}
                  alt="Current intro cover"
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  priority
                  quality={80}
                  placeholder="blur"
                  blurDataURL={photo.blurDataUrl}
                  className="object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-ink/45" />
              </>
            )}
            <div className="absolute inset-0 grid place-items-center">
              <div className="px-6 text-center">
                <p className="font-display text-3xl tracking-tight text-paper sm:text-4xl">
                  Earth <span className="italic text-paper/90">Unseen</span>
                </p>
                <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-paper/70">
                  Photographed in the field
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3">
            <p className="text-sm text-muted">
              {intro.mode === "photo" && "Your photograph is set — shown on every page."}
              {intro.mode === "color" && (
                <>
                  Your colour is set — <span className="text-ink">{previewColor}</span>.
                </>
              )}
              {intro.mode === "auto" &&
                "Automatic — each page uses its own quiet accent colour."}
            </p>
            {intro.mode !== "auto" && (
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
        <div className="space-y-6">
          <div className="rounded-xl border border-hairline bg-white/40 p-6">
            <p className="eyebrow text-muted">Photograph</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              Use a photo
            </h2>

            <div
              role="button"
              tabIndex={0}
              aria-label="Choose a photograph for the intro cover"
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
                handlePhoto(e.dataTransfer.files?.[0]);
              }}
              className="mt-6 grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-hairline bg-white/40 px-6 py-9 text-center transition-colors hover:border-ink/50 hover:bg-paper-deep/60"
            >
              <div>
                <div className="mx-auto grid size-11 place-items-center rounded-full bg-ink/5 text-ink">
                  {status === "uploading" ? (
                    <Spinner className="size-5" />
                  ) : (
                    <ImagePlus className="size-5" strokeWidth={1.5} />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium">
                  {status === "uploading"
                    ? "Saving…"
                    : "Drag a photo here, or click to browse"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  The wordmark stays readable with a soft dark veil.
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  handlePhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-hairline bg-white/40 p-6">
            <p className="eyebrow text-muted">Colour</p>
            <h2 className="mt-2 font-display text-2xl tracking-tight">
              Use a colour
            </h2>

            <div className="mt-6 flex items-end gap-3">
              <label className="flex-1">
                <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
                  Pick
                </span>
                <div className="flex items-center gap-2 rounded-md border border-hairline bg-white/70 px-3 py-2">
                  <span
                    className="size-6 shrink-0 rounded-full border border-hairline"
                    style={{ backgroundColor: colorDraft }}
                  />
                  <input
                    type="text"
                    value={colorDraft}
                    onChange={(e) => setColorDraft(e.target.value)}
                    aria-label="Colour hex value"
                    className="w-full bg-transparent text-sm uppercase outline-none"
                  />
                </div>
              </label>
              <div className="grid size-11 shrink-0 place-items-center">
                <input
                  type="color"
                  value={colorDraft}
                  onChange={(e) => setColorDraft(e.target.value)}
                  aria-label="Open the colour picker"
                  className="size-11 cursor-pointer rounded-md border border-hairline bg-white p-1"
                />
              </div>
            </div>

            <Button
              onClick={handleColor}
              disabled={busy}
              className="mt-4 w-full"
            >
              {status === "saving" && !confirmClear ? (
                <Spinner className="size-4 text-paper" />
              ) : (
                <Palette className="size-4" />
              )}
              Apply colour
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-muted">
            Only the background changes — the wordmark, timing and lift are
            exactly as designed. The choice applies to every page.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Reset the intro cover?"
        body="It will go back to each page’s automatic accent colour."
        confirmLabel="Reset"
        pending={status === "saving"}
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
