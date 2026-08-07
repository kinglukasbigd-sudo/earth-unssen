import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SEASONS } from "@/lib/seasons";
import type { Photo, Season } from "@/lib/types";
import { Hero } from "@/components/public/home/Hero";
import { Reveal } from "@/components/public/Reveal";
import { PhotoEntry } from "@/components/public/PhotoEntry";
import { SeasonCards } from "@/components/public/SeasonCards";
import { getPhotos, getHeroBackground } from "@/lib/data";

export default async function HomePage() {
  const photos = await getPhotos();
  const featured = photos.slice(0, 6);
  const cover = photos[0] ?? null;
  const heroBackground = await getHeroBackground();

  const counts: Record<Season, number> = {
    winter: 0,
    spring: 0,
    summer: 0,
    fall: 0,
  };
  for (const photo of photos) counts[photo.season] += 1;

  const covers = Object.fromEntries(
    SEASONS.map((season) => [
      season,
      photos.find((p) => p.season === season) ?? null,
    ]),
  ) as Record<Season, Photo | null>;

  return (
    <>
      <Hero cover={cover} background={heroBackground} />

      <section id="featured" className="container-feed py-24 sm:py-32">
        <Reveal>
          <div className="flex flex-col gap-6 border-b border-hairline pb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-muted">Featured</p>
              <h2 className="mt-4 font-display text-xxl">
                Recent photographs
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              A selection from the field — new work appears here as it is
              posted.
            </p>
          </div>
        </Reveal>

        {featured.length > 0 ? (
          <div className="mt-14 flex flex-col gap-16 sm:mt-16 sm:gap-20">
            {featured.map((photo, index) => (
              <Reveal key={photo.id} delay={(index % 3) * 0.06}>
                <PhotoEntry
                  photo={photo}
                  index={index}
                  total={featured.length}
                  photos={featured}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="mt-14 rounded-lg border border-dashed border-hairline px-6 py-24 text-center">
              <h3 className="font-display text-2xl italic text-muted">
                The first photographs are on their way.
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
                This journal is just beginning. When the first entries are
                posted, they will appear here.
              </p>
            </div>
          </Reveal>
        )}
      </section>

      <section id="seasons" className="container-site border-t border-hairline py-24 sm:py-32">
        <Reveal>
          <div className="mb-12 sm:mb-16">
            <p className="eyebrow text-muted">The four seasons</p>
            <h2 className="mt-4 max-w-xl font-display text-xxl">
              A year, in four parts.
            </h2>
          </div>
        </Reveal>
        <Reveal>
          <SeasonCards covers={covers} counts={counts} />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/seasons/winter"
              className="group inline-flex items-center gap-2 text-sm font-medium tracking-wide"
            >
              Start at the beginning of the year
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="container-site border-t border-hairline py-24 sm:py-32">
        <div className="grid gap-10 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="eyebrow text-muted">About</p>
            <h2 className="mt-4 font-display text-lg-display">
              A quiet record of the wild, one season at a time.
            </h2>
          </Reveal>
          <Reveal className="md:col-span-6 md:col-start-7" delay={0.08}>
            <p className="leading-relaxed text-muted">
              Earth Unseen is a personal archive of landscape and wildlife
              photography — taken wherever the seasons lead, with whatever
              camera is in hand. No studios, no staging; just light, weather,
              and patience.
            </p>
            <Link
              href="/about"
              className="group mt-6 inline-flex items-center gap-2 text-sm font-medium tracking-wide"
            >
              Read the story
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
