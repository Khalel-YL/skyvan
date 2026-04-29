"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getLocaleFromPathname, getLocalizedPath } from "../lib/public-routing";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const slug = pathname.split("/").filter(Boolean).slice(1).join("/");

  return (
    <div className="inline-flex rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] p-1 text-[11px] font-medium">
      {(["tr", "en"] as const).map((nextLocale) => (
        <Link
          key={nextLocale}
          href={getLocalizedPath(nextLocale, slug)}
          className={`rounded-full px-3 py-2 transition ${
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
