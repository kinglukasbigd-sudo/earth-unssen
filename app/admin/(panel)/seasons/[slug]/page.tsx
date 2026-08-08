import { notFound } from "next/navigation";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import { getPhotos, getSeasonSettings } from "@/lib/data";
import { SeasonSettings } from "@/components/admin/SeasonSettings";
import type { Season } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return SEASONS.map((slug) => ({ slug }));
}

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(SEASONS as readonly string[]).includes(slug)) notFound();
  const season = slug as Season;
  const info = seasonInfo(season);

  const [initial, photos] = await Promise.all([
    getSeasonSettings(season),
    getPhotos(season),
  ]);

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow text-muted" style={{ color: info.accentDeep }}>
          {info.label} · {photos.length}{" "}
          {photos.length === 1 ? "photograph" : "photographs"}
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">
          Edit {info.label}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Choose the hero photograph behind the {info.label.toLowerCase()} page,
          pin which photograph is its cover, and write the tagline and
          description. The layout, typography and motion are untouched.
        </p>
      </div>
      <div className="mt-10">
        <SeasonSettings season={season} initial={initial} photos={photos} />
      </div>
    </div>
  );
}
