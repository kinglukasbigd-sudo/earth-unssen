"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Reorder, useDragControls } from "motion/react";
import { GripVertical, Save, Trash2 } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import type { Photo, Season } from "@/lib/types";
import {
  deletePhotoAction,
  reorderPhotosAction,
  updatePhotoAction,
} from "@/lib/actions/admin";
import { Button, ConfirmDialog, SeasonSelect } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";

type Filter = "all" | Season;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PhotoRowProps {
  photo: Photo;
  draggable: boolean;
  onSave: (id: string, patch: { caption: string; season: Season }) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}

function PhotoRow({ photo, draggable, onSave, onDelete, saving }: PhotoRowProps) {
  const controls = useDragControls();
  const [caption, setCaption] = useState(photo.caption);
  const [season, setSeason] = useState<Season>(photo.season);
  const dirty = caption.trim() !== photo.caption || season !== photo.season;

  const content = (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white/60 p-3 shadow-sm sm:gap-4 sm:p-4">
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        disabled={!draggable}
        aria-label="Drag to reorder"
        className={`grid size-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-paper-deep hover:text-ink ${
          draggable ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-30"
        }`}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="relative aspect-[4/3] size-20 shrink-0 overflow-hidden rounded-md bg-paper-deep sm:size-24">
        <Image
          src={photo.imageUrl}
          alt=""
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption…"
          maxLength={280}
          className="w-full bg-transparent font-display text-lg leading-snug outline-none placeholder:text-muted/60"
          aria-label="Caption"
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <SeasonSelect
            value={season}
            onChange={setSeason}
            className="w-32"
          />
          <span className="text-xs tabular-nums text-muted">
            {formatDate(photo.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:flex-row">
        {dirty && (
          <Button
            onClick={() => onSave(photo.id, { caption: caption.trim(), season })}
            disabled={saving}
            className="px-3 py-2 text-xs"
          >
            {saving ? <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Save className="size-3.5" />}
            Save
          </Button>
        )}
        <button
          type="button"
          onClick={() => onDelete(photo.id)}
          aria-label="Delete photograph"
          className="grid size-9 place-items-center self-center rounded-md text-muted transition-colors hover:bg-[#9c3f2d]/10 hover:text-[#9c3f2d]"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );

  if (draggable) {
    return (
      <Reorder.Item
        value={photo}
        dragListener={false}
        dragControls={controls}
        className="relative"
      >
        {content}
      </Reorder.Item>
    );
  }
  return <div>{content}</div>;
}

export function PhotoManager({ initialPhotos }: { initialPhotos: Photo[] }) {
  const router = useRouter();
  const toast = useToast();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [filter, setFilter] = useState<Filter>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visible = useMemo(
    () =>
      filter === "all"
        ? photos
        : photos.filter((p) => p.season === filter),
    [photos, filter],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: photos.length,
      winter: 0,
      spring: 0,
      summer: 0,
      fall: 0,
    };
    for (const p of photos) c[p.season] += 1;
    return c;
  }, [photos]);

  async function persistReorder(ordered: Photo[]) {
    setPhotos(ordered);
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(async () => {
      const res = await reorderPhotosAction(ordered.map((p) => p.id));
      if (res.ok) {
        toast({ title: "Order saved", description: "The new order is live on the site." });
      } else {
        toast({ title: res.error ?? "Could not save the order." });
      }
      router.refresh();
    }, 450);
  }

  async function handleSave(
    id: string,
    patch: { caption: string; season: Season },
  ) {
    setSavingId(id);
    const res = await updatePhotoAction({ id, ...patch });
    setSavingId(null);
    if (res.ok) {
      toast({ title: "Changes saved", description: "The live site has been updated." });
    } else {
      toast({ title: res.error ?? "Could not save changes." });
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await deletePhotoAction(deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (res.ok) {
      toast({ title: "Photograph deleted" });
    } else {
      toast({ title: res.error ?? "Could not delete this photo." });
    }
    router.refresh();
  }

  const deletingPhoto = photos.find((p) => p.id === deleteId) ?? null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["all", ...SEASONS] as Filter[]).map((f) => {
          const active = filter === f;
          const label = f === "all" ? "All" : seasonInfo(f).label;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline bg-white/50 text-muted hover:border-ink/40 hover:text-ink"
              }`}
              aria-pressed={active}
            >
              {label}
              <span className={`text-xs tabular-nums ${active ? "text-paper/60" : "text-muted/70"}`}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted">
        {filter !== "all"
          ? "Drag to reorder is available when viewing all seasons."
          : "Drag the handle to reorder. Newest photographs appear first by default."}
      </p>

      {photos.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-hairline px-6 py-16 text-center">
          <h2 className="font-display text-2xl italic text-muted">
            The library is empty.
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Head to the Upload tab to publish your first photograph. It will
            appear on the site immediately.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          {filter === "all" ? (
            <Reorder.Group
              axis="y"
              values={visible}
              onReorder={persistReorder}
              className="flex flex-col gap-3"
            >
              {visible.map((photo) => (
                <PhotoRow
                  key={photo.id}
                  photo={photo}
                  draggable
                  onSave={handleSave}
                  onDelete={(id) => setDeleteId(id)}
                  saving={savingId === photo.id}
                />
              ))}
            </Reorder.Group>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((photo) => (
                <PhotoRow
                  key={photo.id}
                  photo={photo}
                  draggable={false}
                  onSave={handleSave}
                  onDelete={(id) => setDeleteId(id)}
                  saving={savingId === photo.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingPhoto}
        title="Delete this photograph?"
        body={
          deletingPhoto
            ? `“${deletingPhoto.caption || "Untitled"}” will be removed from the site and its image file deleted. This cannot be undone.`
            : ""
        }
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
