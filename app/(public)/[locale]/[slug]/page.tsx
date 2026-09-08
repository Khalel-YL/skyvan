import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { JsonLd } from "../../components/JsonLd";
import { PublicPageRenderer } from "../../components/PublicPageRenderer";
import {
  buildPublicMetadata,
  buildWebsiteJsonLd,
  getPublicSlugPage,
  normalizePublicLocale,
} from "../../lib/public-content";
import {
  getCanonicalPublicSlug,
  getLocalizedPath,
  isPublicLocale,
  LEGACY_WORKSHOP_SLUG,
} from "../../lib/public-routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizePublicLocale(rawLocale);
  const page = await getPublicSlugPage(locale, getCanonicalPublicSlug(slug));

  if (!page) {
    notFound();
  }

  return buildPublicMetadata(page);
}

export default async function PublicSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale, slug } = await params;

  if (!isPublicLocale(rawLocale)) {
    redirect(`/tr/${slug}`);
  }

  if (slug === LEGACY_WORKSHOP_SLUG) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      for (const item of Array.isArray(value) ? value : value ? [value] : []) {
        query.append(key, item);
      }
    }
    const suffix = query.size > 0 ? `?${query.toString()}` : "";
    permanentRedirect(`${getLocalizedPath(rawLocale, "workshop")}${suffix}`);
  }

  const page = await getPublicSlugPage(rawLocale, getCanonicalPublicSlug(slug));

  if (!page) {
    notFound();
  }

  return (
    <>
      <JsonLd data={buildWebsiteJsonLd(page)} />
      <PublicPageRenderer page={page} />
    </>
  );
}
