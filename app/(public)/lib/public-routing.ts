export type PublicLocale = "tr" | "en";

export const PUBLIC_LOCALES: PublicLocale[] = ["tr", "en"];
export const DEFAULT_PUBLIC_LOCALE: PublicLocale = "tr";
const CROSS_LOCALE_STATIC_SLUGS = new Set([
  "sistem",
  "nasil-calisir",
  "karavan-deneyimi",
  "muhendislik",
  "uretim-sureci",
  "sss",
  "iletisim",
  "proje-baslat",
]);

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

export function getLanguageSwitchPath(pathname: string, nextLocale: PublicLocale) {
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = isPublicLocale(segments[0]) ? segments[0] : DEFAULT_PUBLIC_LOCALE;
  const slug = segments.slice(1).join("/");

  if (nextLocale === currentLocale) {
    return getLocalizedPath(nextLocale, slug);
  }

  if (!slug || CROSS_LOCALE_STATIC_SLUGS.has(slug)) {
    return getLocalizedPath(nextLocale, slug);
  }

  return getLocalizedPath(nextLocale);
}
