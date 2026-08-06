import type { Photo, Season } from "@/lib/types";
import { seasonInfo } from "@/lib/seasons";
import { PhotoImage } from "@/components/public/PhotoImage";

interface SeasonHeroProps {
  season: Season;
  count: number;
  cover: Photo | null;
}

export function SeasonHero({ season, count, cover }: SeasonHeroProps) {
  const info = seasonInfo(season);

  return (
    <section
      className="relative overflow-hidden pb-14 pt-32 sm:pb-20 sm:pt-44"
      style={{ background: info.moodBg }}
    >
      {cover && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 scale-110 opacity-[0.14] blur-2xl"
          >
            <PhotoImage
              photo={cover}
              fill
              priority
              quality={40}
              sizes="100vw"
              className="object-cover"
            />
          </div>          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${info.moodBg} 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, ${info.moodBg} 100%)`,
            }}
          />
        </>
      )}

      <div className="container-site relative">
        <p className="eyebrow" style={{ color: info.accentDeep }}>
          Season · {count} {count === 1 ? "photograph" : "photographs"}
        </p>
        <h1 className="mt-5 font-display text-hero-sm">{info.label}</h1>
        <p
          className="mt-5 font-display text-xl italic sm:text-2xl"
          style={{ color: info.accentDeep }}
        >
          {info.tagline}
        </p>
        <p className="mt-6 max-w-xl leading-relaxed text-muted">
          {info.description}
        </p>
      </div>
    </section>
  );
}
