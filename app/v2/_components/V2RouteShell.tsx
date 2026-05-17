import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BrandLogo } from "@/app/(public)/components/BrandLogo";
import { ThemeToggle } from "@/app/(public)/components/ThemeToggle";

import {
  type V2Locale,
  type V2PageDefinition,
  type V2PageKey,
  getV2Page,
  getV2Path,
} from "../_lib/v2-routing";

const navKeys: V2PageKey[] = ["system", "howItWorks", "engineering", "experience", "media"];

export function V2RouteShell({
  locale,
  page,
}: {
  locale: V2Locale;
  page: V2PageDefinition;
}) {
  const nextLocale: V2Locale = locale === "tr" ? "en" : "tr";
  const hasAlternate = getV2Page(nextLocale, page.key);
  const ctaKey: V2PageKey = "startProject";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--public-bg)] text-[var(--public-text)]">
      <header className="border-b border-[var(--public-border)] bg-[var(--public-bg)]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3 md:px-8">
          <Link href={getV2Path(locale, "home")} className="flex items-center gap-3">
            <BrandLogo variant="emblem" tone="auto" size="headerEmblem" priority />
            <span className="font-[var(--font-skyvan)] text-sm font-semibold uppercase tracking-[var(--skyvan-tracking)]">
              SKYVAN V2
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm text-[var(--public-muted)] lg:flex">
            {navKeys.map((key) => (
              <Link
                key={key}
                href={getV2Path(locale, key)}
                className="transition hover:text-[var(--public-text)]"
              >
                {getV2Page(locale, key).title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle locale={locale} />
            <Link
              href={getV2Path(nextLocale, hasAlternate.key)}
              className="rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-3 py-2 text-xs font-semibold text-[var(--public-muted)] transition hover:text-[var(--public-text)]"
            >
              {nextLocale.toUpperCase()}
            </Link>
            <Link
              href={getV2Path(locale, ctaKey)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--public-accent)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-text)] transition hover:opacity-90"
            >
              {locale === "tr" ? "Proje Başlat" : "Start Project"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-10 px-5 py-20 md:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(20rem,0.62fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--public-muted)]">
              {page.eyebrow}
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight text-[var(--public-text)] md:text-7xl">
              {page.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--public-muted)]">
              {page.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={getV2Path(locale, ctaKey)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--public-accent)] px-5 py-3 text-sm font-semibold text-[var(--public-accent-text)] transition hover:opacity-90"
              >
                {locale === "tr" ? "Proje Başlat" : "Start Project"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={getV2Path(locale, "system")}
                className="inline-flex items-center rounded-full border border-[var(--public-border)] bg-[var(--public-surface)] px-5 py-3 text-sm font-semibold text-[var(--public-text)] transition hover:bg-[var(--public-surface-strong)]"
              >
                {locale === "tr" ? "Sistemi Gör" : "View System"}
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--public-border)] bg-[var(--public-surface)] p-6 shadow-2xl shadow-black/5">
            <div className="aspect-square rounded-[1.5rem] border border-[var(--public-border)] bg-[var(--public-bg-soft)] p-6">
              <div className="flex h-full flex-col justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--public-muted)]">
                  Skyvan Journey OS
                </p>
                <div className="space-y-3">
                  {(locale === "tr"
                    ? ["Rota", "Yaşam", "Risk", "Enerji", "Üretim"]
                    : ["Route", "Living", "Risk", "Energy", "Production"]
                  ).map((item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-[var(--public-border-strong)]" />
                      <span className="min-w-24 text-right text-sm font-semibold text-[var(--public-text)]">
                        {String(index + 1).padStart(2, "0")} · {item}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-sm leading-6 text-[var(--public-muted)]">
                  {locale === "tr"
                    ? "Bu alan, yeni Skyvan deneyiminin karar katmanlarını sakin ve kontrollü şekilde görünür kılar."
                    : "This surface makes the decision layers of the new Skyvan experience calm, clear, and controlled."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
