import "server-only";

import type { Metadata } from "next";
import { and, eq, or } from "drizzle-orm";

import { db, hasDatabaseUrl } from "@/db/db";
import { localizedContent } from "@/db/schema";

import {
  fallbackSlugs,
  getFallbackPage,
  type PublicBlock,
  type PublicBlockMedia,
  type PublicPageContent,
} from "./launch-content";
import {
  DEFAULT_PUBLIC_LOCALE,
  PUBLIC_LOCALES,
  type PublicLocale,
  getLocalizedPath,
  isPublicLocale,
} from "./public-routing";

type LocalizedPageRow = typeof localizedContent.$inferSelect;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://skyvan.com.tr").replace(/\/+$/g, "");
const HOME_SLUGS: Record<PublicLocale, string[]> = {
  tr: ["ana-sayfa", "anasayfa", "home", "homepage"],
  en: ["home", "homepage", "anasayfa"],
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getContentObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isPublishedContent(value: unknown) {
  return getContentObject(value)?.isPublished === true;
}

function isHomeSlug(locale: PublicLocale, slug: string) {
  return HOME_SLUGS[locale].includes(slug);
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => asString(item)).filter(Boolean).slice(0, 8);
}

function normalizeStats(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const raw = getContentObject(item);
      const label = asString(raw?.label);
      const statValue = asString(raw?.value);

      return label && statValue ? { label, value: statValue } : null;
    })
    .filter(Boolean)
    .slice(0, 6) as Array<{ label: string; value: string }>;
}

const mediaTypes = new Set<PublicBlockMedia["mediaType"]>([
  "image",
  "video",
  "model3d",
]);
const mediaProviders = new Set<NonNullable<PublicBlockMedia["provider"]>>([
  "direct",
  "youtube",
  "vimeo",
  "external",
]);

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function detectDirectVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.toLowerCase();

    return [".mp4", ".webm", ".mov", ".m4v", ".ogv"].some((extension) =>
      pathname.endsWith(extension),
    );
  } catch {
    return false;
  }
}

function extractYouTubeVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (!["youtube.com", "m.youtube.com", "music.youtube.com"].includes(hostname)) {
      return null;
    }

    if (parsed.pathname === "/watch") {
      return parsed.searchParams.get("v") || null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    return (parts[0] === "shorts" || parts[0] === "embed") && parts[1] ? parts[1] : null;
  } catch {
    return null;
  }
}

function extractVimeoVideoId(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (hostname === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      return parts[0] === "video" && parts[1] && /^\d+$/.test(parts[1]) ? parts[1] : null;
    }

    if (hostname !== "vimeo.com") {
      return null;
    }

    return parsed.pathname.split("/").filter(Boolean).reverse().find((part) => /^\d+$/.test(part)) || null;
  } catch {
    return null;
  }
}

function classifyVideoProvider(url: string): NonNullable<PublicBlockMedia["provider"]> {
  if (extractYouTubeVideoId(url)) {
    return "youtube";
  }

  if (extractVimeoVideoId(url)) {
    return "vimeo";
  }

  if (detectDirectVideoUrl(url)) {
    return "direct";
  }

  return "external";
}

function normalizeMedia(value: unknown): PublicBlockMedia | undefined {
  const raw = getContentObject(value);

  if (!raw) {
    return undefined;
  }

  const mediaId = asString(raw.mediaId);
  const mediaType = asString(raw.mediaType).toLowerCase();
  const title = asString(raw.title);
  const url = asString(raw.url);

  if (!mediaId || !mediaTypes.has(mediaType as PublicBlockMedia["mediaType"]) || !title || !isSafeHttpUrl(url)) {
    return undefined;
  }

  const previewUrl = asString(raw.previewUrl);
  const embedUrl = asString(raw.embedUrl);
  const rawProvider = asString(raw.provider).toLowerCase();
  const provider = mediaProviders.has(rawProvider as NonNullable<PublicBlockMedia["provider"]>)
    ? (rawProvider as NonNullable<PublicBlockMedia["provider"]>)
    : mediaType === "video"
      ? classifyVideoProvider(url)
      : undefined;
  const youtubeId = provider === "youtube" ? extractYouTubeVideoId(url) : null;
  const vimeoId = provider === "vimeo" ? extractVimeoVideoId(url) : null;
  const normalizedEmbedUrl =
    embedUrl && isSafeHttpUrl(embedUrl)
      ? embedUrl
      : youtubeId
        ? `https://www.youtube.com/embed/${youtubeId}`
        : vimeoId
          ? `https://player.vimeo.com/video/${vimeoId}`
          : undefined;

  return {
    mediaId,
    mediaType: mediaType as PublicBlockMedia["mediaType"],
    title,
    url,
    previewUrl: previewUrl && isSafeHttpUrl(previewUrl) ? previewUrl : undefined,
    embedUrl: normalizedEmbedUrl,
    provider,
    altText: asString(raw.altText) || undefined,
  };
}

function sanitizeBlock(value: unknown): PublicBlock | null {
  const raw = getContentObject(value);

  if (!raw) {
    return null;
  }

  const type = asString(raw.type);

  if (type === "hero") {
    const heading = asString(raw.heading);

    if (!heading) {
      return null;
    }

    return {
      type,
      heading,
      subtext: asString(raw.subtext) || undefined,
      body: asString(raw.body) || undefined,
      ctaLabel: asString(raw.ctaLabel) || undefined,
      ctaHref: asString(raw.ctaHref) || undefined,
      media: normalizeMedia(raw.media),
    };
  }

  if (type === "text") {
    const body = asString(raw.body) || asString(raw.content);
    const heading = asString(raw.heading);

    if (!body && !heading) {
      return null;
    }

    return {
      type,
      heading: heading || undefined,
      body: body || undefined,
    };
  }

  if (type === "feature-list") {
    const items = normalizeItems(raw.items);

    if (items.length === 0) {
      return null;
    }

    return {
      type,
      heading: asString(raw.heading) || undefined,
      subtext: asString(raw.subtext) || undefined,
      items,
    };
  }

  if (type === "stats") {
    const stats = normalizeStats(raw.stats);

    if (stats.length === 0) {
      return null;
    }

    return {
      type,
      heading: asString(raw.heading) || undefined,
      stats,
    };
  }

  if (type === "cta") {
    const heading = asString(raw.heading);

    if (!heading) {
      return null;
    }

    return {
      type,
      heading,
      body: asString(raw.body) || undefined,
      ctaLabel: asString(raw.ctaLabel) || undefined,
      ctaHref: asString(raw.ctaHref) || undefined,
    };
  }

  return null;
}

function pageFromAdminRow(row: LocalizedPageRow, locale: PublicLocale, slug: string): PublicPageContent | null {
  if (!isPublishedContent(row.contentJson)) {
    return null;
  }

  const content = getContentObject(row.contentJson);
  const rawBlocks = Array.isArray(content?.blocks) ? content.blocks : [];
  const blocks = rawBlocks.map(sanitizeBlock).filter(Boolean) as PublicBlock[];

  if (blocks.length === 0) {
    return null;
  }

  const title = asString(row.title) || asString(row.seoTitle) || "Skyvan";
  const description = asString(row.description) || asString(row.seoDescription);

  return {
    locale,
    slug,
    source: "admin",
    title,
    description,
    seoTitle: asString(row.seoTitle) || title,
    seoDescription: asString(row.seoDescription) || description || getFallbackPage(locale, slug).seoDescription,
    blocks,
  };
}

async function fetchPublishedAdminPage(locale: PublicLocale, slug: string) {
  if (!hasDatabaseUrl || !db) {
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(localizedContent)
      .where(
        and(
          eq(localizedContent.entityType, "page"),
          eq(localizedContent.locale, locale),
          eq(localizedContent.slug, slug),
        ),
      )
      .limit(1);

    const row = rows[0];
    return row ? pageFromAdminRow(row, locale, slug) : null;
  } catch (error) {
    console.warn("public admin page read skipped:", error);
    return null;
  }
}

async function fetchPublishedAdminHome(locale: PublicLocale) {
  if (!hasDatabaseUrl || !db) {
    return null;
  }

  try {
    const slugConditions = HOME_SLUGS[locale].map((slug) => eq(localizedContent.slug, slug));
    const rows = await db
      .select()
      .from(localizedContent)
      .where(
        and(
          eq(localizedContent.entityType, "page"),
          eq(localizedContent.locale, locale),
          or(...slugConditions),
        ),
      );

    for (const preferredSlug of HOME_SLUGS[locale]) {
      const row = rows.find((candidate) => candidate.slug === preferredSlug);
      const page = row ? pageFromAdminRow(row, locale, "") : null;

      if (page) {
        return page;
      }
    }

    return null;
  } catch (error) {
    console.warn("public admin homepage read skipped:", error);
    return null;
  }
}

export function normalizePublicLocale(locale: string): PublicLocale {
  return isPublicLocale(locale) ? locale : DEFAULT_PUBLIC_LOCALE;
}

export async function getPublicPage(locale: PublicLocale, slug?: string | null) {
  const normalizedSlug = asString(slug);
  const adminPage = normalizedSlug
    ? await fetchPublishedAdminPage(locale, normalizedSlug)
    : await fetchPublishedAdminHome(locale);

  return adminPage ?? getFallbackPage(locale, normalizedSlug);
}

export async function getPublicSlugPage(locale: PublicLocale, slug: string) {
  const normalizedSlug = asString(slug);

  if (!normalizedSlug) {
    return null;
  }

  const adminPage = await fetchPublishedAdminPage(locale, normalizedSlug);

  if (adminPage) {
    return adminPage;
  }

  if (fallbackSlugs.includes(normalizedSlug)) {
    return getFallbackPage(locale, normalizedSlug);
  }

  return null;
}

export function getPublicUrl(locale: PublicLocale, slug?: string | null) {
  return `${SITE_URL}${getLocalizedPath(locale, slug)}`;
}

async function publicRouteExists(locale: PublicLocale, slug: string) {
  if (!slug) {
    return true;
  }

  if (fallbackSlugs.includes(slug)) {
    return true;
  }

  return Boolean(await fetchPublishedAdminPage(locale, slug));
}

export async function buildRouteLanguages(locale: PublicLocale, slug?: string | null) {
  const normalizedSlug = asString(slug);
  const languages: Record<string, string> = {
    [locale]: getPublicUrl(locale, normalizedSlug),
  };

  for (const alternateLocale of PUBLIC_LOCALES) {
    if (alternateLocale === locale) {
      continue;
    }

    if (await publicRouteExists(alternateLocale, normalizedSlug)) {
      languages[alternateLocale] = getPublicUrl(alternateLocale, normalizedSlug);
    }
  }

  languages["x-default"] = languages.tr ?? languages[locale];

  return languages;
}

export async function buildAlternates(locale: PublicLocale, slug?: string | null) {
  const normalizedSlug = asString(slug);
  const languages = await buildRouteLanguages(locale, normalizedSlug);

  return {
    canonical: getPublicUrl(locale, normalizedSlug),
    languages,
  };
}

export async function buildPublicMetadata(page: PublicPageContent): Promise<Metadata> {
  const url = getPublicUrl(page.locale, page.slug);

  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: await buildAlternates(page.locale, page.slug),
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      url,
      siteName: "Skyvan",
      type: "website",
      locale: page.locale === "tr" ? "tr_TR" : "en_US",
      alternateLocale: page.locale === "tr" ? ["en_US"] : ["tr_TR"],
    },
    twitter: {
      card: "summary_large_image",
      title: page.seoTitle,
      description: page.seoDescription,
    },
  };
}

export function buildWebsiteJsonLd(page: PublicPageContent) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description || page.seoDescription,
    url: getPublicUrl(page.locale, page.slug),
    inLanguage: page.locale === "tr" ? "tr-TR" : "en-US",
    isPartOf: {
      "@type": "WebSite",
      name: "Skyvan",
      url: SITE_URL,
    },
  };
}

export async function listPublishedAdminPublicPages() {
  if (!hasDatabaseUrl || !db) {
    return [];
  }

  try {
    const rows = await db
      .select()
      .from(localizedContent)
      .where(eq(localizedContent.entityType, "page"));

    return rows
      .filter((row) => {
        if (!isPublicLocale(row.locale) || !isPublishedContent(row.contentJson)) {
          return false;
        }

        const slug = asString(row.slug);

        return Boolean(slug) && !isHomeSlug(row.locale, slug);
      })
      .map((row) => ({
        locale: row.locale as PublicLocale,
        slug: asString(row.slug),
      }));
  } catch (error) {
    console.warn("public sitemap admin page read skipped:", error);
    return [];
  }
}

export function listFallbackPublicPaths() {
  return PUBLIC_LOCALES.flatMap((locale) => [
    { locale, slug: "" },
    ...fallbackSlugs.map((slug) => ({ locale, slug })),
  ]);
}
