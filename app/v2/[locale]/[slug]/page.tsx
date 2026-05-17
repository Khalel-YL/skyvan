import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { V2RouteShell } from "../../_components/V2RouteShell";
import { getV2PageBySlug, isV2Locale } from "../../_lib/v2-routing";

export const metadata: Metadata = {
  title: "Skyvan V2",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function V2SlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isV2Locale(locale)) {
    notFound();
  }

  const page = getV2PageBySlug(locale, slug);

  if (!page) {
    notFound();
  }

  return <V2RouteShell locale={locale} page={page} />;
}
