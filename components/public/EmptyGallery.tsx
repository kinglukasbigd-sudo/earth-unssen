import { Camera } from "lucide-react";
import type { Season } from "@/lib/types";
import { seasonInfo } from "@/lib/seasons";

interface EmptyGalleryProps {
  season: Season;
}

export function EmptyGallery({ season }: EmptyGalleryProps) {
  const info = seasonInfo(season);
  return (
    <div className="container-feed py-24 sm:py-32">
      <div className="mx-auto max-w-md text-center">
        <div
          className="mx-auto grid size-16 place-items-center rounded-full"
          style={{ backgroundColor: info.accentSoft, color: info.accentDeep }}
        >
          <Camera className="size-7" strokeWidth={1.5} />
        </div>
        <h2 className="mt-7 font-display text-3xl tracking-tight">
          Gathering {info.label}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          The {info.label.toLowerCase()} collection is still being built.
          Photographs will appear here as they are posted.
        </p>
      </div>
    </div>
  );
}
