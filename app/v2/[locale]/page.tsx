import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { V2RouteShell } from "../_components/V2RouteShell";
import { getV2Page, isV2Locale } from "../_lib/v2-routing";

export const metadata: Metadata = {
  title: "Skyvan V2",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function V2LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isV2Locale(locale)) {
    notFound();
  }

  return <V2RouteShell locale={locale} page={getV2Page(locale, "home")} />;
}
