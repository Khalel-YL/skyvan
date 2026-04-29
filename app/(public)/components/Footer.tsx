"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getLocaleFromPathname, getLocalizedPath } from "../lib/public-routing";
import { BrandLogo } from "./BrandLogo";

const footerLinks = {
  tr: [
    { label: "Sistem", slug: "sistem" },
    { label: "Karavan Deneyimi", slug: "karavan-deneyimi" },
    { label: "Üretim Süreci", slug: "uretim-sureci" },
    { label: "İletişim", slug: "iletisim" },
  ],
  en: [
    { label: "System", slug: "sistem" },
    { label: "Van Experience", slug: "karavan-deneyimi" },
    { label: "Production", slug: "uretim-sureci" },
    { label: "Contact", slug: "iletisim" },
  ],
};

export function Footer() {
  const locale = getLocaleFromPathname(usePathname());

  return (
    <footer className="border-t border-[var(--public-border)] bg-[var(--public-bg-soft)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:px-8">
        <div className="flex flex-col gap-6 text-left md:flex-row md:items-center md:gap-8">
          <div className="shrink-0">
            <BrandLogo
              variant="logo"
              tone="auto"
              size="footer"
            />
          </div>
          <div className="max-w-md">
            <p className="text-base font-semibold tracking-tight text-[var(--public-text)]">
              Freedom, Engineered.
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
              {locale === "tr"
                ? "Skyvan; hayal edilen rota, doğru araç, yaşam düzeni ve üretim hazırlığını sakin, güvenilir ve premium bir deneyimde buluşturur."
                : "Skyvan brings the route, vehicle, living layout, and production preparation into one calm, premium experience."}
            </p>
          </div>
        </div>

        <nav className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-[var(--public-muted)] sm:flex sm:flex-wrap sm:justify-end">
          {footerLinks[locale].map((item) => (
            <Link
              key={item.slug}
              href={getLocalizedPath(locale, item.slug)}
              className="transition hover:text-[var(--public-text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-t border-[var(--public-border)] px-5 py-5 text-xs text-[var(--public-muted)] md:px-8">
        <span>© {new Date().getFullYear()} Skyvan</span>
        <span>{locale === "tr" ? "Public render layer" : "Public render layer"}</span>
      </div>
    </footer>
  );
}
