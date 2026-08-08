import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  SEASONS,
  seasonInfo,
  resolveSeasonInfo,
  NEXT_SEASON,
  PREV_SEASON,
} from "@/lib/seasons";
import { getPhotos, getSeasonSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { SeasonHero } from "@/components/public/SeasonHero";
import { PhotoEntry } from "@/components/public/PhotoEntry";
import { EmptyGallery } from "@/components/public/EmptyGallery";
import { Reveal } from "@/components/public/Reveal";
import type { Season } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return SEASONS.map((season) => ({ slug: season }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!(SEASONS as readonly string[]).includes(slug)) return {};
  const season = slug as Season;
  const [photos, settings] = await Promise.all([
    getPhotos(season),
    getSeasonSettings(season),
  ]);
  const info = resolveSeasonInfo(season, settings);
  const cover =
    photos.find((photo) => photo.id === settings.coverPhotoId) ??
    photos[0] ??
    null;

  return {
    title: info.label,
    description: info.description,
    openGraph: {
      title: `${info.label} — Earth Unseen`,
      description: info.description,
      url: `${SITE_URL}/seasons/${season}`,
      images: cover
        ? [{ url: cover.imageUrl, width: cover.width, height: cover.height }]
        : undefined,
    },
  };
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const season = slug as Season;
  const [photos, settings] = await Promise.all([
    getPhotos(season),
    getSeasonSettings(season),
  ]);
  const info = resolveSeasonInfo(season, settings);
  const cover =
    photos.find((photo) => photo.id === settings.coverPhotoId) ??
    photos[0] ??
    null;
  const background = settings.hero ?? cover;
  const prev = PREV_SEASON[season];
  const next = NEXT_SEASON[season];

  return (
    <div style={{ background: info.moodBg }}>
      <SeasonHero info={info} count={photos.length} background={background} />

      {photos.length > 0 ? (
        <div className="container-feed flex flex-col gap-14 py-12 sm:gap-20 sm:py-16">
          {photos.map((photo, index) => (
            <Reveal key={photo.id} delay={(index % 3) * 0.06}>
              <PhotoEntry
                photo={photo}
                index={index}
                total={photos.length}
                photos={photos}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyGallery season={season} />
      )}

      <nav
        aria-label="Adjacent seasons"
        className="container-site flex items-center justify-between gap-4 border-t border-hairline py-14 sm:py-16"
      >
        <Link
          href={`/seasons/${prev}`}
          className="group flex flex-col items-start gap-1.5"
        >
          <span className="eyebrow text-muted">Previous</span>
          <span className="flex items-center gap-2 font-display text-2xl italic opacity-75 transition-opacity duration-300 group-hover:opacity-100 sm:text-3xl">
            <ArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-1" />
            {seasonInfo(prev).label}
          </span>
        </Link>

        <p className="eyebrow hidden text-muted md:block">
          Continue the year
        </p>

        <Link
          href={`/seasons/${next}`}
          className="group flex flex-col items-end gap-1.5"
        >
          <span className="eyebrow text-muted">Next</span>
          <span
            className="flex items-center gap-2 font-display text-2xl italic transition-opacity duration-300 group-hover:opacity-100 sm:text-3xl"
            style={{ color: seasonInfo(next).accentDeep }}
          >
            {seasonInfo(next).label}
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      </nav>
    </div>
  );
}
