"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { getLocaleFromPathname, getLocalizedPath } from "../lib/public-routing";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const navItems = {
  tr: [
    { label: "Sistem", slug: "sistem" },
    { label: "Nasıl Çalışır", slug: "nasil-calisir" },
    { label: "Mühendislik", slug: "muhendislik" },
    { label: "SSS", slug: "sss" },
  ],
  en: [
    { label: "System", slug: "sistem" },
    { label: "How it works", slug: "nasil-calisir" },
    { label: "Engineering", slug: "muhendislik" },
    { label: "FAQ", slug: "sss" },
  ],
};

export function Header() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--public-border)] bg-[var(--public-bg)]/90 backdrop-blur-xl">
      <div className="mx-auto grid min-h-16 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 md:px-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Link href={getLocalizedPath(locale)} className="group flex min-w-0 items-center justify-self-start">
          <div className="flex items-center gap-3">
            <BrandLogo
              variant="emblem"
              tone="auto"
              size="headerEmblem"
              priority
            />
            <span className="font-[var(--font-skyvan)] tracking-[var(--skyvan-tracking)] uppercase font-semibold text-[13px] md:text-[14px] text-[var(--public-text)] transition group-hover:opacity-75">
              SKYVAN
            </span>
          </div>
        </Link>

        <nav className="hidden items-center justify-center gap-6 text-sm text-[var(--public-muted)] lg:flex">
          {navItems[locale].map((item) => (
            <Link
              key={item.slug}
              href={getLocalizedPath(locale, item.slug)}
              className="transition hover:text-[var(--public-text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 justify-self-end">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <LanguageSwitcher />
          <Link
            href={getLocalizedPath(locale, "proje-baslat")}
            className="hidden items-center gap-2 rounded-full bg-[var(--public-accent)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-text)] transition hover:opacity-90 md:inline-flex"
          >
            {locale === "tr" ? "Proje Başlat" : "Start"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
