import type { MetadataRoute } from "next";

import {
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

  return Array.from(uniquePaths.values()).map((path) => ({
    url: getPublicUrl(path.locale, path.slug),
    lastModified: new Date(),
    changeFrequency: path.slug ? "monthly" : "weekly",
    priority: path.slug ? 0.7 : 1,
    alternates: {
      languages: {
        tr: getPublicUrl("tr", path.slug),
        en: getPublicUrl("en", path.slug),
      },
    },
  }));
}
