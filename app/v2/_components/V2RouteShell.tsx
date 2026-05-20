import Image from "next/image";
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
import {
  type PublicV2Media,
  type V2TheatreTone,
  publicV2HomeContent,
} from "../_lib/v2-home-content";

const navKeys: V2PageKey[] = ["system", "howItWorks", "engineering", "experience", "media"];

function PublicV2MediaTheatre({
  media,
  locale,
  tone = "hero",
}: {
  media: PublicV2Media;
  locale: V2Locale;
  tone?: V2TheatreTone;
}) {
  const emptyLabel = locale === "tr" ? "Medya sahnesi hazırlanıyor" : "Media stage pending";
  const title = media.title ?? emptyLabel;
  const eyebrow = media.eyebrow ?? media.slotName;

  return (
    <figure className="public-v2-theatre" data-tone={tone}>
      <div className="public-v2-theatre-stage">
        {media.type === "image" && media.src ? (
          <Image
            src={media.src}
            alt={media.alt ?? title}
            fill
            sizes="(min-width: 1024px) 48vw, 100vw"
            className="public-v2-theatre-media"
          />
        ) : null}
        {media.type === "video" && media.src ? (
          <video
            className="public-v2-theatre-media"
            src={media.src}
            poster={media.poster}
            muted
            playsInline
            loop
            preload="metadata"
            aria-label={media.alt ?? title}
          />
        ) : null}
        {media.type === "empty" || !media.src ? (
          <div className="public-v2-theatre-empty">
            <span>{eyebrow}</span>
            <strong>{title}</strong>
          </div>
        ) : null}
      </div>
      {media.caption ? <figcaption>{media.caption}</figcaption> : null}
    </figure>
  );
}

function V2Header({ locale, page }: { locale: V2Locale; page: V2PageDefinition }) {
  const nextLocale: V2Locale = locale === "tr" ? "en" : "tr";
  const alternate = getV2Page(nextLocale, page.key);
  const copy = publicV2HomeContent[locale];

  return (
    <header className="public-v2-header">
      <div className="public-v2-header-inner">
        <Link href={getV2Path(locale, "home")} className="public-v2-brand-link">
          <BrandLogo variant="emblem" tone="auto" size="headerEmblem" priority />
          <span>SKYVAN</span>
        </Link>

        <nav className="public-v2-nav" aria-label="V2">
          {navKeys.map((key) => (
            <Link key={key} href={getV2Path(locale, key)}>
              {getV2Page(locale, key).title}
            </Link>
          ))}
        </nav>

        <div className="public-v2-header-actions">
          <ThemeToggle locale={locale} />
          <Link href={getV2Path(nextLocale, alternate.key)} className="public-v2-language-link">
            {copy.nav.languageLabel}
          </Link>
          <Link href={getV2Path(locale, "startProject")} className="public-v2-nav-cta">
            {copy.nav.project}
          </Link>
        </div>
      </div>
    </header>
  );
}

function V2HomePage({ locale }: { locale: V2Locale }) {
  const copy = publicV2HomeContent[locale];

  return (
    <main className="public-v2-main">
      <section className="public-v2-section public-v2-hero" aria-labelledby="v2-hero-title">
        <div className="public-v2-hero-copy public-v2-reveal">
          <p className="public-v2-eyebrow">{copy.hero.eyebrow}</p>
          <h1 id="v2-hero-title">{copy.hero.title}</h1>
          <p>{copy.hero.body}</p>
          <div className="public-v2-action-row">
            <Link href={getV2Path(locale, "startProject")} className="public-v2-primary-action">
              {copy.hero.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={getV2Path(locale, "system")} className="public-v2-secondary-action">
              {copy.hero.secondaryCta}
            </Link>
          </div>
        </div>
        <div className="public-v2-reveal public-v2-reveal-late">
          <PublicV2MediaTheatre media={copy.hero.media} locale={locale} tone="hero" />
        </div>
      </section>

      <section className="public-v2-section public-v2-journey-strip" aria-label="Skyvan Journey OS">
        <ol>
          {copy.journey.items.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="public-v2-section public-v2-scenario" aria-labelledby="v2-scenario-title">
        <div className="public-v2-editorial public-v2-reveal">
          <p className="public-v2-eyebrow">{locale === "tr" ? "SENARYO STÜDYOSU" : "SCENARIO STUDIO"}</p>
          <h2 id="v2-scenario-title">{copy.scenario.title}</h2>
          <p>{copy.scenario.body}</p>
          <ul>
            {copy.scenario.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </div>
        <PublicV2MediaTheatre media={copy.scenario.media} locale={locale} tone="scenario" />
      </section>

      <section className="public-v2-section public-v2-truth" aria-labelledby="v2-truth-title">
        <PublicV2MediaTheatre media={copy.truth.media} locale={locale} tone="proof" />
        <div className="public-v2-editorial public-v2-reveal">
          <p className="public-v2-eyebrow">{locale === "tr" ? "ÜRETİM GERÇEĞİ" : "PRODUCTION TRUTH"}</p>
          <h2 id="v2-truth-title">{copy.truth.title}</h2>
          <p>{copy.truth.body}</p>
          <ul>
            {copy.truth.proofPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="public-v2-section public-v2-workshop" aria-labelledby="v2-workshop-title">
        <div className="public-v2-editorial public-v2-reveal">
          <p className="public-v2-eyebrow">WORKSHOP</p>
          <h2 id="v2-workshop-title">{copy.workshop.title}</h2>
          <p>{copy.workshop.body}</p>
          <ol>
            {copy.workshop.details.map((detail, index) => (
              <li key={detail}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {detail}
              </li>
            ))}
          </ol>
        </div>
        <PublicV2MediaTheatre media={copy.workshop.media} locale={locale} tone="workshop" />
      </section>

      <section className="public-v2-section public-v2-final" aria-labelledby="v2-final-title">
        <p className="public-v2-eyebrow">{locale === "tr" ? "BAŞLANGIÇ" : "BEGINNING"}</p>
        <h2 id="v2-final-title">{copy.final.title}</h2>
        <Link href={getV2Path(locale, "startProject")} className="public-v2-primary-action">
          {copy.final.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}

function V2InnerPage({
  locale,
  page,
}: {
  locale: V2Locale;
  page: V2PageDefinition;
}) {
  const copy = publicV2HomeContent[locale];

  return (
    <main className="public-v2-main">
      <section className="public-v2-section public-v2-inner-page">
        <div className="public-v2-editorial">
          <p className="public-v2-eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <div className="public-v2-action-row">
            <Link href={getV2Path(locale, "startProject")} className="public-v2-primary-action">
              {copy.nav.project}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={getV2Path(locale, "home")} className="public-v2-secondary-action">
              {locale === "tr" ? "Ana Sayfa" : "Home"}
            </Link>
          </div>
        </div>
        <PublicV2MediaTheatre media={copy.hero.media} locale={locale} tone="hero" />
      </section>
    </main>
  );
}

function V2Footer({ locale }: { locale: V2Locale }) {
  const copy = publicV2HomeContent[locale];
  const footerKeys: V2PageKey[] = ["system", "experience", "workshop", "contact"];

  return (
    <footer className="public-v2-footer">
      <div>
        <BrandLogo variant="logo" tone="auto" size="footer" />
        <p>{copy.footer.sentence}</p>
      </div>
      <nav aria-label="V2 footer">
        {footerKeys.map((key) => (
          <Link key={key} href={getV2Path(locale, key)}>
            {getV2Page(locale, key).title}
          </Link>
        ))}
      </nav>
    </footer>
  );
}

export function V2RouteShell({
  locale,
  page,
}: {
  locale: V2Locale;
  page: V2PageDefinition;
}) {
  return (
    <div className="public-v2">
      <V2Header locale={locale} page={page} />
      {page.key === "home" ? (
        <V2HomePage locale={locale} />
      ) : (
        <V2InnerPage locale={locale} page={page} />
      )}
      <V2Footer locale={locale} />
    </div>
  );
}
