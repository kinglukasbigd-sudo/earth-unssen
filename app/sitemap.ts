import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { SEASONS } from "@/lib/seasons";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { url: "/", priority: 1 },
    { url: "/about", priority: 0.6 },
    ...SEASONS.map((season) => ({
      url: `/seasons/${season}`,
      priority: 0.9,
    })),
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));
}
