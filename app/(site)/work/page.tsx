import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPhotos } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { Reveal } from "@/components/public/Reveal";
import { WorkGallery } from "@/components/public/WorkGallery";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const photos = await getPhotos();
  const cover = photos[0];
  return {
    title: "Work",
    description:
      "Every photograph in the Earth Unseen archive — landscape and wildlife across winter, spring, summer and fall.",
    alternates: { canonical: `${SITE_URL}/work` },
    openGraph: {
      title: "Work — Earth Unseen",
      url: `${SITE_URL}/work`,
      images: cover
        ? [{ url: cover.imageUrl, width: cover.width, height: cover.height }]
        : undefined,
    },
  };
}

export default async function WorkPage() {
  const photos = await getPhotos();

  return (
    <>
      <section className="container-site pb-10 pt-36 sm:pt-44">
        <Reveal>
          <p className="eyebrow text-muted">
            The work · {photos.length}{" "}
            {photos.length === 1 ? "photograph" : "photographs"}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-xxl">
            Every photograph,{" "}
            <span className="italic text-muted">in one place.</span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-muted">
            The full archive, newest first. Filter by season, or open any
            photograph to see it larger.
          </p>
        </Reveal>
      </section>

      <section className="container-site pb-24 sm:pb-32">
        {photos.length > 0 ? (
          <WorkGallery photos={photos} />
        ) : (
          <div className="rounded-lg border border-dashed border-hairline px-6 py-24 text-center">
            <h2 className="font-display text-2xl italic text-muted">
              The first photographs are on their way.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
              When the first entries are posted, the full archive will appear
              here.
            </p>
          </div>
        )}
      </section>

      <section className="container-site border-t border-hairline py-20 text-center sm:py-24">
        <Reveal>
          <p className="eyebrow text-muted">Prints &amp; commissions</p>
          <p className="mx-auto mt-4 max-w-xl font-display text-lg-display">
            See something you’d like on your wall, or in your project?
          </p>
          <Link
            href="/contact"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-wide text-paper transition-colors hover:bg-ink/85"
          >
            Get in touch
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
