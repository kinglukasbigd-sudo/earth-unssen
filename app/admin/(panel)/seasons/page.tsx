import Link from "next/link";
import { ArrowUpRight, ImagePlus, Images, Type } from "lucide-react";
import { SEASONS, seasonInfo } from "@/lib/seasons";
import { getAllSeasonSettings } from "@/lib/data";

export default async function SeasonsPage() {
  const settings = await getAllSeasonSettings();

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="border-b border-hairline pb-6">
        <p className="eyebrow text-muted">Season pages</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight">
          Edit the seasons
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Each season has its own window: a hero photograph, a cover for the
          homepage card, and its tagline and description. Only the photograph
          and copy change — every page keeps its exact layout, typography and
          motion.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {SEASONS.map((season) => {
          const info = seasonInfo(season);
          const setting = settings.find((s) => s.season === season);
          const status = [
            setting?.hero ? "hero set" : null,
            setting?.coverPhotoId ? "cover pinned" : null,
            setting?.tagline?.trim() || setting?.description?.trim()
              ? "custom copy"
              : null,
          ].filter(Boolean);

          return (
            <Link
              key={season}
              href={`/admin/seasons/${season}`}
              className="group flex flex-col justify-between gap-8 rounded-xl border border-hairline bg-white/40 p-6 transition-colors hover:border-ink/40 hover:bg-white/60"
            >
              <div
                className="flex items-center justify-between rounded-lg border border-hairline px-5 py-4"
                style={{ backgroundColor: info.accentSoft }}
              >
                <div>
                  <p className="font-display text-2xl italic">{info.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {info.tagline}
                  </p>
                </div>
                <ArrowUpRight
                  className="size-5 text-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  style={{ color: info.accentDeep }}
                />
              </div>

              <div>
                <div className="flex flex-wrap gap-2">
                  {status.length > 0 ? (
                    status.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/70 px-3 py-1 text-xs text-muted"
                      >
                        {item === "hero set" && <ImagePlus className="size-3.5" />}
                        {item === "cover pinned" && <Images className="size-3.5" />}
                        {item === "custom copy" && <Type className="size-3.5" />}
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted">
                      Everything as designed — nothing customised yet.
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-ink transition-colors group-hover:underline">
                  Open the {info.label.toLowerCase()} window
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
