import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { MotionProviders } from "@/components/MotionProviders";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-src",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-src",
  display: "swap",
  axes: ["opsz"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Earth Unseen — Landscape & Wildlife Photography",
    template: "%s · Earth Unseen",
  },
  description:
    "A year in landscape and wildlife photography, collected by season. Landscapes and wildlife photographed in the field — winter, spring, summer and fall.",
  applicationName: "Earth Unseen",
  authors: [{ name: "Earth Unseen" }],
  creator: "Earth Unseen",
  openGraph: {
    type: "website",
    siteName: "Earth Unseen",
    locale: "en_GB",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Earth Unseen — Landscape & Wildlife Photography",
    description:
      "A year in landscape and wildlife photography, collected by season.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#f9f7f3",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body>
        <MotionProviders>{children}</MotionProviders>
      </body>
    </html>
  );
}
