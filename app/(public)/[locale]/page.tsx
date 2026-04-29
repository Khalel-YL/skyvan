import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { JsonLd } from "../components/JsonLd";
import { PublicPageRenderer } from "../components/PublicPageRenderer";
import {
  buildPublicMetadata,
  buildWebsiteJsonLd,
  getPublicPage,
  normalizePublicLocale,
} from "../lib/public-content";
import { isPublicLocale } from "../lib/public-routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizePublicLocale(rawLocale);
  const page = await getPublicPage(locale);

  return buildPublicMetadata(page);
}

export default async function PublicHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isPublicLocale(rawLocale)) {
    redirect("/tr");
  }

  const page = await getPublicPage(rawLocale);

  return (
    <>
      <JsonLd data={buildWebsiteJsonLd(page)} />
      <PublicPageRenderer page={page} />
    </>
  );
}
