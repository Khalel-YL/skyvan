"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getLanguageSwitchPath, getLocaleFromPathname } from "../lib/public-routing";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);

  return (
    <nav
      className="sv-language-switcher"
      aria-label={locale === "tr" ? "Dil seçimi" : "Language choice"}
    >
      {(["tr", "en"] as const).map((nextLocale) => (
        <Link
          key={nextLocale}
          lang={nextLocale}
          hrefLang={nextLocale}
          aria-label={nextLocale === "tr" ? "Türkçe" : "English"}
          aria-current={locale === nextLocale ? "page" : undefined}
          href={getLanguageSwitchPath(pathname, nextLocale)}
          className={locale === nextLocale ? "is-active" : ""}
        >
          {nextLocale.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
