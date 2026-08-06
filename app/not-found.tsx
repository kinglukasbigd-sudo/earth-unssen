import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-32 text-center">
      <p className="eyebrow text-muted">404</p>
      <h1 className="mt-5 font-display text-xxl">Page not found.</h1>
      <Link
        href="/"
        className="mt-9 text-sm font-medium tracking-wide underline underline-offset-4"
      >
        Return home
      </Link>
    </div>
  );
}
