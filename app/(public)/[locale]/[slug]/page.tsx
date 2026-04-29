import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { JsonLd } from "../../components/JsonLd";
import { PublicPageRenderer } from "../../components/PublicPageRenderer";
import {
  buildPublicMetadata,
  buildWebsiteJsonLd,
  getPublicSlugPage,
  normalizePublicLocale,
} from "../../lib/public-content";
import { isPublicLocale } from "../../lib/public-routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = normalizePublicLocale(rawLocale);
  const page = await getPublicSlugPage(locale, slug);

  if (!page) {
    notFound();
  }

  return buildPublicMetadata(page);
}

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;

  if (!isPublicLocale(rawLocale)) {
    redirect(`/tr/${slug}`);
  }

  const page = await getPublicSlugPage(rawLocale, slug);

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
