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

type PublicV2Media = {
  type: "image" | "video" | "empty";
  src?: string;
  poster?: string;
  alt?: string;
  eyebrow?: string;
  title?: string;
  caption?: string;
  slotName: string;
};

type V2TheatreTone = "hero" | "scenario" | "proof" | "workshop";

type V2HomeContent = {
  nav: {
    project: string;
    languageLabel: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    media: PublicV2Media;
  };
  journey: {
    items: string[];
  };
  scenario: {
    title: string;
    body: string;
    questions: string[];
    media: PublicV2Media;
  };
  truth: {
    title: string;
    body: string;
    proofPoints: string[];
    media: PublicV2Media;
  };
  workshop: {
    title: string;
    body: string;
    details: string[];
    media: PublicV2Media;
  };
  final: {
    title: string;
    cta: string;
  };
  footer: {
    sentence: string;
  };
};

const navKeys: V2PageKey[] = ["system", "howItWorks", "engineering", "experience", "media"];

const publicV2HomeContent: Record<V2Locale, V2HomeContent> = {
  tr: {
    nav: {
      project: "Proje Başlat",
      languageLabel: "EN",
    },
    hero: {
      eyebrow: "SKYVAN STUDIO",
      title: "Karavan kararını görsel, teknik ve üretilebilir bir sisteme dönüştürüyoruz.",
      body:
        "Skyvan; araç, yaşam senaryosu, ürün seçimi ve üretim gerçekliğini tek kontrollü akışta birleştirir.",
      primaryCta: "Proje Başlat",
      secondaryCta: "Sistemi Keşfet",
      media: {
        type: "empty",
        slotName: "hero",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Hero sahnesi",
      },
    },
    journey: {
      items: ["Rota", "Yaşam", "Risk", "Enerji", "Üretim"],
    },
    scenario: {
      title: "Önce yaşam senaryosu netleşir.",
      body:
        "Skyvan’da konfigürasyon, rastgele ürün seçimiyle değil; rota, kullanım biçimi, bağımsızlık ihtiyacı ve teknik sınırlarla başlar.",
      questions: [
        "Nerede yaşayacak?",
        "Ne kadar bağımsız kalacak?",
        "Hangi teknik sınırlar korunacak?",
      ],
      media: {
        type: "empty",
        slotName: "scenario",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Senaryo sahnesi",
      },
    },
    truth: {
      title: "Görünen şey, üretilebilir olmalı.",
      body:
        "Skyvan’da görsel karar; ürün bağı, teknik sınır ve insan onayıyla birlikte düşünülür.",
      proofPoints: [
        "Ürün bağı olmadan görsel karar yok.",
        "Teknik sınır olmadan konfigürasyon yok.",
        "İnsan onayı olmadan kritik karar yok.",
      ],
      media: {
        type: "empty",
        slotName: "production-proof",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Üretim kanıt sahnesi",
      },
    },
    workshop: {
      title: "Workshop rastgele seçim için açılmaz.",
      body:
        "Araç, ürün ve teknik veri hazır olduğunda konfigürasyon güvenli şekilde ilerler.",
      details: ["Araç platformu", "Ürün veri bağı", "Teknik doğrulama", "Mühür öncesi kontrol"],
      media: {
        type: "empty",
        slotName: "workshop-gate",
        eyebrow: "Skyvan medya sahnesi",
        title: "Medya sahnesi hazırlanıyor",
        caption: "Workshop kapısı sahnesi",
      },
    },
    final: {
      title: "Skyvan, karavan kararını kontrol edilebilir bir sisteme dönüştürür.",
      cta: "Proje Başlat",
    },
    footer: {
      sentence: "Skyvan karavan kararını görsel, teknik ve üretilebilir bir akışta hazırlar.",
    },
  },
  en: {
    nav: {
      project: "Start Project",
      languageLabel: "TR",
    },
    hero: {
      eyebrow: "SKYVAN STUDIO",
      title: "We turn camper decisions into a visual, technical and buildable system.",
      body:
        "Skyvan connects vehicle, lifestyle scenario, product selection and production truth in one controlled flow.",
      primaryCta: "Start Project",
      secondaryCta: "Explore the System",
      media: {
        type: "empty",
        slotName: "hero",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Hero stage",
      },
    },
    journey: {
      items: ["Route", "Life", "Risk", "Energy", "Production"],
    },
    scenario: {
      title: "The lifestyle scenario comes first.",
      body:
        "In Skyvan, configuration does not start with random product selection. It starts with route, usage style, independence needs and technical limits.",
      questions: [
        "Where will it live?",
        "How independent should it be?",
        "Which technical limits must stay protected?",
      ],
      media: {
        type: "empty",
        slotName: "scenario",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Scenario stage",
      },
    },
    truth: {
      title: "What you see must be buildable.",
      body:
        "In Skyvan, a visual decision is evaluated together with product binding, technical limits and human approval.",
      proofPoints: [
        "No visual decision without product binding.",
        "No configuration without technical limits.",
        "No critical decision without human approval.",
      ],
      media: {
        type: "empty",
        slotName: "production-proof",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Production proof stage",
      },
    },
    workshop: {
      title: "Workshop does not open for random selection.",
      body:
        "Configuration moves safely when vehicle, product and technical data are ready.",
      details: [
        "Vehicle platform",
        "Product data binding",
        "Technical validation",
        "Pre-seal control",
      ],
      media: {
        type: "empty",
        slotName: "workshop-gate",
        eyebrow: "Skyvan media stage",
        title: "Media stage pending",
        caption: "Workshop gate stage",
      },
    },
    final: {
      title: "Skyvan turns camper decisions into a controllable system.",
      cta: "Start Project",
    },
    footer: {
      sentence: "Skyvan prepares camper decisions as a visual, technical and buildable flow.",
    },
  },
};

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
