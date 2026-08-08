"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ImagePlus, Images, RefreshCcw } from "lucide-react";
import { resolveSeasonInfo, seasonInfo } from "@/lib/seasons";
import type { Photo, Season, SeasonSettings as SeasonSettingsType } from "@/lib/types";
import { compressImage } from "@/lib/image/compress";
import {
  clearSeasonHeroAction,
  setSeasonCoverAction,
  setSeasonHeroAction,
  updateSeasonTextAction,
} from "@/lib/actions/admin";
import { Button, ConfirmDialog, Spinner } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type Status = "idle" | "uploading" | "saving";

function photoLabel(photo: Photo): string {
  return photo.caption.trim() || "Untitled photograph";
}

export function SeasonSettings({
  season,
  initial,
  photos,
}: {
  season: Season;
  initial: SeasonSettingsType;
  photos: Photo[];
}) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const info = seasonInfo(season);
  const [settings, setSettings] = useState<SeasonSettingsType>(initial);
  const [taglineDraft, setTaglineDraft] = useState(initial.tagline ?? "");
  const [descriptionDraft, setDescriptionDraft] = useState(
    initial.description ?? "",
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirmClearHero, setConfirmClearHero] = useState(false);

  const resolved = resolveSeasonInfo(season, settings);
  const cover =
    photos.find((photo) => photo.id === settings.coverPhotoId) ??
    photos[0] ??
    null;
  const background = settings.hero ?? cover;
  const busy = status === "uploading" || status === "saving";

  function setHero(hero: Photo | null) {
    setSettings((prev) => ({ ...prev, hero }));
  }
  function setCover(coverPhotoId: string | null) {
    setSettings((prev) => ({ ...prev, coverPhotoId }));
  }

  async function handleHero(file: File | undefined | null) {
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
    formData.set("file", new File([image.blob], "hero.jpg", { type: "image/jpeg" }));
    formData.set("width", String(image.width));
    formData.set("height", String(image.height));
    formData.set("blurDataUrl", image.blurDataUrl);

    const result = await setSeasonHeroAction(season, formData);
    setStatus("idle");

    if (result.ok && result.photo) {
      setHero(result.photo);
      toast({
        title: "Hero photograph saved",
        description: "The season opening now uses this image.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not save the new hero photograph.");
    }
  }

  async function handleClearHero() {
    setStatus("saving");
    const result = await clearSeasonHeroAction(season);
    setStatus("idle");
    setConfirmClearHero(false);

    if (result.ok) {
      setHero(null);
      toast({
        title: "Hero photograph reset",
        description: "The season opening now uses the cover photograph.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not reset the hero photograph.");
    }
  }

  async function handleCover(value: string) {
    const photoId = value ? value : null;
    setError(null);
    setStatus("saving");
    const result = await setSeasonCoverAction(season, photoId);
    setStatus("idle");

    if (result.ok) {
      setCover(photoId);
      toast({
        title: "Cover photograph saved",
        description: photoId
          ? "This photograph is now the season cover."
          : "The newest photograph is the cover again.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not save the cover photograph.");
    }
  }

  async function handleTextSave() {
    setError(null);
    setStatus("saving");
    const result = await updateSeasonTextAction(season, taglineDraft, descriptionDraft);
    setStatus("idle");

    if (result.ok) {
      setSettings((prev) => ({
        ...prev,
        tagline: taglineDraft.trim() ? taglineDraft.trim() : null,
        description: descriptionDraft.trim() ? descriptionDraft.trim() : null,
      }));
      toast({
        title: "Season copy saved",
        description: "The season page now reads as written.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not save the season copy.");
    }
  }

  async function handleTextClear() {
    setError(null);
    setStatus("saving");
    const result = await updateSeasonTextAction(season, "", "");
    setStatus("idle");

    if (result.ok) {
      setTaglineDraft("");
      setDescriptionDraft("");
      setSettings((prev) => ({ ...prev, tagline: null, description: null }));
      toast({
        title: "Season copy reset",
        description: "The designed tagline and description are back.",
      });
      router.refresh();
    } else {
      setError(result.error ?? "Could not reset the season copy.");
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="overflow-hidden rounded-xl border border-hairline bg-white/60">
          <div
            className="relative aspect-[16/10] overflow-hidden"
            style={{ backgroundColor: info.moodBg }}
          >
            {background && (
              <>
                <div aria-hidden className="absolute inset-0 scale-110 opacity-[0.14] blur-2xl">
                  <Image
                    src={background.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    priority
                    quality={40}
                    placeholder="blur"
                    blurDataURL={background.blurDataUrl}
                    className="object-cover"
                  />
                </div>
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${info.moodBg} 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, ${info.moodBg} 100%)`,
                  }}
                />
              </>
            )}
            <div className="relative flex h-full flex-col justify-center px-6 sm:px-10">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
                style={{ color: info.accentDeep }}
              >
                Season · {photos.length}{" "}
                {photos.length === 1 ? "photograph" : "photographs"}
              </p>
              <p className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
                {resolved.label}
              </p>
              <p
                className="mt-3 font-display text-xl italic sm:text-2xl"
                style={{ color: info.accentDeep }}
              >
                {resolved.tagline}
              </p>
              <p className="mt-4 max-w-xl leading-relaxed text-muted">
                {resolved.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-4 py-3">
            <p className="text-sm text-muted">
              {settings.hero
                ? "Your hero photograph is set."
                : "No hero photograph set — the cover is used behind the text."}
            </p>
            {settings.hero && (
              <Button
                variant="ghost"
                onClick={() => setConfirmClearHero(true)}
                disabled={busy}
                className="px-3 py-2 text-xs"
              >
                <RefreshCcw className="size-3.5" />
                Reset hero
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

      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-hairline bg-white/40 p-6">
          <p className="eyebrow text-muted">Opening photograph</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            Hero background
          </h2>

          <div
            role="button"
            tabIndex={0}
            aria-label={`Choose a hero photograph for ${info.label}`}
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
              handleHero(e.dataTransfer.files?.[0]);
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
                Shown softly blurred behind the season title.
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                handleHero(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-white/40 p-6">
          <p className="eyebrow text-muted">Season card</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            Cover photograph
          </h2>

          <div className="mt-6 flex items-center gap-3">
            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-md border border-hairline bg-paper-deep">
              {cover ? (
                <Image
                  src={cover.imageUrl}
                  alt={photoLabel(cover)}
                  fill
                  sizes="64px"
                  quality={60}
                  placeholder="blur"
                  blurDataURL={cover.blurDataUrl}
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-muted">
                  <Images className="size-5" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <p className="text-sm text-muted">
              {cover ? (
                <>
                  The card on the homepage uses{" "}
                  <span className="text-ink">{photoLabel(cover)}</span>.
                </>
              ) : (
                <>No photographs in this season yet.</>
              )}
            </p>
          </div>

          <label className="mt-5 block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Choose
            </span>
            <select
              value={settings.coverPhotoId ?? ""}
              onChange={(e) => handleCover(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-md border border-hairline bg-white/70 py-2.5 pl-3.5 pr-9 text-sm text-ink outline-none transition-colors focus:border-ink"
            >
              <option value="">Automatic — newest photograph</option>
              {photos.map((photo) => (
                <option key={photo.id} value={photo.id}>
                  {photoLabel(photo)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-hairline bg-white/40 p-6">
          <p className="eyebrow text-muted">Editorial copy</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight">
            Tagline &amp; description
          </h2>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
                Tagline
              </span>
              <input
                type="text"
                value={taglineDraft}
                onChange={(e) => setTaglineDraft(e.target.value)}
                maxLength={140}
                placeholder={info.tagline}
                className="w-full rounded-md border border-hairline bg-white/70 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
              />
              <span className="mt-1.5 block text-xs text-muted">
                Leave blank to keep the designed tagline.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-muted">
                Description
              </span>
              <textarea
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder={info.description}
                className="w-full resize-none rounded-md border border-hairline bg-white/70 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-ink"
              />
              <span className="mt-1.5 block text-xs text-muted">
                Shown under the season title. Leave blank for the designed copy.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={handleTextSave} disabled={busy} className="flex-1">
                {status === "saving" ? (
                  <Spinner className="size-4 text-paper" />
                ) : (
                  <Check className="size-4" />
                )}
                Save copy
              </Button>
              <Button
                variant="ghost"
                onClick={handleTextClear}
                disabled={busy}
                className="px-3 py-2.5 text-xs"
              >
                <RefreshCcw className="size-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Only the photograph and copy change — the layout, typography and
          motion of the season page stay exactly as designed.
        </p>
      </div>

      <ConfirmDialog
        open={confirmClearHero}
        title="Reset the hero photograph?"
        body="The season opening will go back to using the cover photograph automatically."
        confirmLabel="Reset"
        pending={status === "saving"}
        onConfirm={handleClearHero}
        onCancel={() => setConfirmClearHero(false)}
      />
    </div>
  );
}
