"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getLanguageSwitchPath, getLocaleFromPathname } from "../lib/public-routing";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);

  return (
    <div className="sv-language-switcher">
      {(["tr", "en"] as const).map((nextLocale) => (
        <Link
          key={nextLocale}
          lang={nextLocale}
          hrefLang={nextLocale}
          aria-label={nextLocale === "tr" ? "Türkçe" : "English"}
          aria-current={locale === nextLocale ? "page" : undefined}
          href={getLanguageSwitchPath(pathname, nextLocale)}
          className={`transition ${
            locale === nextLocale
              ? "bg-[var(--public-accent)] text-[var(--public-accent-text)]"
              : "text-[var(--public-muted)] hover:bg-[var(--public-subtle)] hover:text-[var(--public-text)]"
          }`}
        >
          {nextLocale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
