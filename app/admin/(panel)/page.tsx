import { getPhotos } from "@/lib/data";
import { PhotoManager } from "@/components/admin/PhotoManager";

export default async function ManagePage() {
  const photos = await getPhotos();

  return (
    <div className="container-site py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <p className="eyebrow text-muted">Library</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight">
            Manage photographs
          </h1>
        </div>
        <p className="text-sm tabular-nums text-muted">
          {photos.length} {photos.length === 1 ? "photograph" : "photographs"}
        </p>
      </div>
      <div className="mt-8">
        <PhotoManager initialPhotos={photos} />
      </div>
    </div>
  );
}
