import type { ReactNode } from "react";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { PageTransition } from "@/components/public/PageTransition";
import { LightboxProvider } from "@/components/public/lightbox";
import { IntroCover } from "@/components/public/IntroCover";
import { getIntroBackground } from "@/lib/data";

// Public pages refresh automatically after admin changes (see lib/actions/admin).
export const revalidate = 120;

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const introBackground = await getIntroBackground();

  return (
    <div className="flex min-h-dvh flex-col">
      <IntroCover background={introBackground} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <LightboxProvider>
          <PageTransition>{children}</PageTransition>
        </LightboxProvider>
      </main>
      <Footer />
    </div>
  );
}
