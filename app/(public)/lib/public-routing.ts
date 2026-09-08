export type PublicLocale = "tr" | "en";

export const PUBLIC_LOCALES: PublicLocale[] = ["tr", "en"];
export const DEFAULT_PUBLIC_LOCALE: PublicLocale = "tr";
const CROSS_LOCALE_STATIC_SLUGS = new Set([
  "workshop",
  "nasil-calisir",
  "karavan-deneyimi",
  "muhendislik",
  "uretim-sureci",
  "sss",
  "hakkimizda",
  "iletisim",
  "proje-baslat",
]);

export const LEGACY_WORKSHOP_SLUG = "sistem";
export const PUBLIC_WORKSHOP_SLUG = "workshop";

export function getCanonicalPublicSlug(slug?: string | null) {
  const normalizedSlug = String(slug ?? "").replace(/^\/+|\/+$/g, "");
  return normalizedSlug === LEGACY_WORKSHOP_SLUG ? PUBLIC_WORKSHOP_SLUG : normalizedSlug;
}

export function getCanonicalPublicHref(href: string) {
  return href.replace(
    /^\/(tr|en)\/sistem(?=\/|[?#]|$)/,
    (_match, locale: PublicLocale) => `/${locale}/${PUBLIC_WORKSHOP_SLUG}`,
  );
}

export function isPublicLocale(value: string): value is PublicLocale {
  return value === "tr" || value === "en";
}

export function getLocaleFromPathname(pathname: string): PublicLocale {
  const [firstSegment] = pathname.split("/").filter(Boolean);
  return isPublicLocale(firstSegment) ? firstSegment : DEFAULT_PUBLIC_LOCALE;
}

export function getLocalizedPath(locale: PublicLocale, slug?: string | null) {
  const normalizedSlug = getCanonicalPublicSlug(slug);
  return normalizedSlug ? `/${locale}/${normalizedSlug}` : `/${locale}`;
}

export function getLanguageSwitchPath(pathname: string, nextLocale: PublicLocale) {
  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = isPublicLocale(segments[0]) ? segments[0] : DEFAULT_PUBLIC_LOCALE;
  const slug = getCanonicalPublicSlug(segments.slice(1).join("/"));

  if (nextLocale === currentLocale) {
    return getLocalizedPath(nextLocale, slug);
  }

  if (!slug || CROSS_LOCALE_STATIC_SLUGS.has(slug)) {
    return getLocalizedPath(nextLocale, slug);
  }

  return getLocalizedPath(nextLocale);
}
