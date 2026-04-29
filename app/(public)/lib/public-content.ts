import "server-only";

import type { Metadata } from "next";
import { and, eq, or } from "drizzle-orm";

import { db, hasDatabaseUrl } from "@/db/db";
import { localizedContent } from "@/db/schema";

import {
  fallbackSlugs,
  getFallbackPage,
  type PublicBlock,
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
  tr: ["anasayfa", "home", "homepage"],
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

export function getPublicUrl(locale: PublicLocale, slug?: string | null) {
  return `${SITE_URL}${getLocalizedPath(locale, slug)}`;
}

export function buildAlternates(locale: PublicLocale, slug?: string | null) {
  const normalizedSlug = asString(slug);

  return {
    canonical: getPublicUrl(locale, normalizedSlug),
    languages: {
      tr: getPublicUrl("tr", normalizedSlug),
      en: getPublicUrl("en", normalizedSlug),
      "x-default": getPublicUrl("tr", normalizedSlug),
    },
  };
}

export function buildPublicMetadata(page: PublicPageContent): Metadata {
  const url = getPublicUrl(page.locale, page.slug);

  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: buildAlternates(page.locale, page.slug),
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
      .filter((row) => isPublicLocale(row.locale) && isPublishedContent(row.contentJson) && asString(row.slug))
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
