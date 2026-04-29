import type { MetadataRoute } from "next";

import {
  buildRouteLanguages,
  getPublicUrl,
  listFallbackPublicPaths,
  listPublishedAdminPublicPages,
} from "./(public)/lib/public-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fallbackPaths = listFallbackPublicPaths();
  const adminPaths = await listPublishedAdminPublicPages();
  const uniquePaths = new Map<string, { locale: "tr" | "en"; slug: string }>();

  for (const path of [...fallbackPaths, ...adminPaths]) {
    uniquePaths.set(`${path.locale}:${path.slug}`, path);
  }

  return Promise.all(
    Array.from(uniquePaths.values()).map(async (path) => ({
      url: getPublicUrl(path.locale, path.slug),
      lastModified: new Date(),
      changeFrequency: path.slug ? "monthly" : "weekly",
      priority: path.slug ? 0.7 : 1,
      alternates: {
        languages: await buildRouteLanguages(path.locale, path.slug),
      },
    })),
  );
}
