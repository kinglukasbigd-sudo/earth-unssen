import type { ReactNode } from "react";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { PageTransition } from "@/components/public/PageTransition";
import { LightboxProvider } from "@/components/public/lightbox";
import { IntroCover } from "@/components/public/IntroCover";
import { getAllSeasonSettings, getIntroBackground } from "@/lib/data";
import type { Season } from "@/lib/types";

// Public pages refresh automatically after admin changes (see lib/actions/admin).
export const revalidate = 120;

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [introBackground, seasonSettings] = await Promise.all([
    getIntroBackground(),
    getAllSeasonSettings(),
  ]);

  const seasonTaglines = Object.fromEntries(
    seasonSettings
      .filter((s) => s.tagline?.trim())
      .map((s) => [s.season, s.tagline as string]),
  ) as Partial<Record<Season, string>>;

  return (
    <div className="flex min-h-dvh flex-col">
      <IntroCover background={introBackground} seasonTaglines={seasonTaglines} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <LightboxProvider>
          <PageTransition seasonTaglines={seasonTaglines}>{children}</PageTransition>
        </LightboxProvider>
      </main>
      <Footer />
    </div>
  );
}
