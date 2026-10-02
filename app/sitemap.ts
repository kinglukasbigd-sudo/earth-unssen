import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";
import { SEASONS } from "@/lib/seasons";
import { getPhotos } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    { url: "/", priority: 1 },
    { url: "/work", priority: 0.9 },
    { url: "/about", priority: 0.6 },
    { url: "/contact", priority: 0.6 },
    ...SEASONS.map((season) => ({
      url: `/seasons/${season}`,
      priority: 0.9,
    })),
  ];

  const pages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${SITE_URL}${route.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route.priority,
  }));

  const photos = await getPhotos().catch(() => []);
  return [
    ...pages,
    ...photos.map((photo) => ({
      url: `${SITE_URL}/photos/${photo.id}`,
      lastModified: photo.createdAt ? new Date(photo.createdAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
      images: [photo.imageUrl.startsWith("http") ? photo.imageUrl : `${SITE_URL}${photo.imageUrl}`],
    })),
  ];
}
