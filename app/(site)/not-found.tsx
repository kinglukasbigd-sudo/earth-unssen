import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SiteNotFound() {
  return (
    <section className="container-site flex min-h-[72vh] flex-col items-center justify-center py-32 text-center">
      <p className="eyebrow text-muted">404</p>
      <h1 className="mt-5 max-w-xl font-display text-xxl">
        This view is out of frame.
      </h1>
      <p className="mt-5 max-w-sm leading-relaxed text-muted">
        The page you are looking for doesn’t exist, or has been moved to a
        different part of the year.
      </p>
      <Link
        href="/"
        className="group mt-9 inline-flex items-center gap-2 text-sm font-medium tracking-wide"
      >
        <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
        Back to the start
      </Link>
    </section>
  );
}
