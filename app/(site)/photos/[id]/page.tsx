import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { getPhoto, getPhotos } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { seasonInfo } from "@/lib/seasons";
import type { Photo } from "@/lib/types";
import { PhotoImage } from "@/components/public/PhotoImage";
import { ShareButton } from "@/components/public/ShareButton";

export const revalidate = 120;

// Rendered on first visit, then cached and refreshed like the other pages.
export async function generateStaticParams() {
  return [];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadPhoto(id: string): Promise<Photo | null> {
  return UUID.test(id) ? getPhoto(id) : null;
}

function titleOf(photo: Photo): string {
  return photo.caption || `${seasonInfo(photo.season).label} photograph`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const photo = await loadPhoto(id);
  if (!photo) return {};
  const title = titleOf(photo);
  const description = `${title} — ${seasonInfo(photo.season).label}, from the Earth Unseen archive of landscape and wildlife photography.`;
  const url = `${SITE_URL}/photos/${photo.id}`;
  const image = { url: photo.imageUrl, width: photo.width, height: photo.height, alt: title };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function Neighbour({
  photo,
  direction,
}: {
  photo: Photo | null;
  direction: "prev" | "next";
}) {
  if (!photo) return <span />;
  const next = direction === "next";
  return (
    <Link
      href={`/photos/${photo.id}`}
      className={`group flex items-center gap-4 ${next ? "flex-row-reverse text-right" : ""}`}
    >
      <span className="relative block size-16 shrink-0 overflow-hidden rounded-md bg-paper-deep sm:size-20">
        <PhotoImage
          photo={photo}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </span>
      <span className="min-w-0">
        <span className="eyebrow flex items-center gap-1.5 text-muted">
          {!next && <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />}
          {next ? "Next" : "Previous"}
          {next && <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />}
        </span>
        <span className="mt-1 line-clamp-1 font-display text-lg italic">
          {photo.caption || "Untitled"}
        </span>
      </span>
    </Link>
  );
}

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await loadPhoto(id);
  if (!photo) notFound();

  const all = await getPhotos();
  const index = all.findIndex((p) => p.id === photo.id);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;
  const info = seasonInfo(photo.season);
  const title = titleOf(photo);

  return (
    <article style={{ background: info.moodBg }}>
      <div className="container-site pb-16 pt-28 sm:pb-20 sm:pt-32">
        <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-4">
          <Link
            href={`/seasons/${photo.season}`}
            className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide"
            style={{ color: info.accentDeep }}
          >
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
            {info.label}
          </Link>
          <Link
            href="/work"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            All work
          </Link>
        </nav>

        <div className="mt-8 flex justify-center">
          <PhotoImage
            photo={photo}
            priority
            quality={92}
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="h-auto max-h-[78vh] w-auto max-w-full rounded-lg shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]"
          />
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <h1 className="font-display text-lg-display">
              {photo.caption || <span className="italic text-muted">Untitled</span>}
            </h1>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted">
              <span style={{ color: info.accentDeep }}>{info.label}</span>
              <span aria-hidden className="mx-2">·</span>
              <time dateTime={photo.createdAt}>{formatDate(photo.createdAt)}</time>
              <span aria-hidden className="mx-2">·</span>
              {photo.width}×{photo.height}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareButton title={title} />
            <Link
              href={`/contact?photo=${photo.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-ink/85"
            >
              <Mail className="size-4" />
              Enquire
            </Link>
          </div>
        </div>
      </div>

      {(prev || next) && (
        <nav
          aria-label="More photographs"
          className="container-site grid grid-cols-2 gap-6 border-t border-hairline py-10 sm:py-12"
        >
          <Neighbour photo={prev} direction="prev" />
          <Neighbour photo={next} direction="next" />
        </nav>
      )}
    </article>
  );
}
