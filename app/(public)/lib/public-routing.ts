export type PublicLocale = "tr" | "en";

export const PUBLIC_LOCALES: PublicLocale[] = ["tr", "en"];
export const DEFAULT_PUBLIC_LOCALE: PublicLocale = "tr";

export function isPublicLocale(value: string): value is PublicLocale {
  return value === "tr" || value === "en";
}

export function getLocaleFromPathname(pathname: string): PublicLocale {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  return isPublicLocale(firstSegment) ? firstSegment : DEFAULT_PUBLIC_LOCALE;
}

export function getLocalizedPath(locale: PublicLocale, slug?: string | null) {
  const normalizedSlug = String(slug ?? "").replace(/^\/+|\/+$/g, "");
  return normalizedSlug ? `/${locale}/${normalizedSlug}` : `/${locale}`;
}
