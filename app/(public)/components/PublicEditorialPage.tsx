import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type {
  PublicBlockMedia,
  PublicEditorialPresentation,
  PublicPageContent,
} from "../lib/launch-content";
import {
  isCuratedPublicSlug,
  publicEditorialContent,
  type CuratedPublicSlug,
  type EditorialSection,
} from "../lib/public-editorial-content";
import { publicLaunchContent } from "../lib/public-launch-copy";
import {
  publicLaunchAssets,
  getApprovedCmsLaunchMedia,
  type PublicLaunchAssetId,
  type PublicLaunchMediaRole,
} from "../lib/public-launch-media";
import { getLaunchHero } from "../lib/public-launch-selection";
import { resolveEditorialVisual } from "../lib/public-media-surface";
import { getLocalizedPath } from "../lib/public-routing";
import { PublicConceptMedia } from "./PublicConceptMedia";
import { PublicLivingConceptStudies, PublicLivingGallery } from "./PublicLivingGallery";
import { PublicMediaSurface } from "./PublicMediaSurface";
import { PublicProjectAction } from "./PublicProjectAction";

type Visual = { asset: PublicLaunchAssetId; className?: string };

function getAssetAlt(assetId: PublicLaunchAssetId, locale: PublicPageContent["locale"]): string {
  const asset = publicLaunchAssets[assetId];
  if ("alt" in asset) return String(asset.alt[locale]);
  const labels: Partial<Record<PublicLaunchAssetId, { tr: string; en: string }>> = {
    lounge: { tr: "Oturum, mutfak ve dolaşım ilişkisini gösteren yaşam alanı konsepti.", en: "Living-space concept showing the relationship between lounge, galley and circulation." },
    "exterior-landscape": { tr: "Skyvan araç gövdesi için dış görünüş konsepti.", en: "Exterior concept for a Skyvan vehicle body." },
  };
  return labels[assetId]?.[locale] ?? "";
}

const sectionVisuals: Partial<Record<CuratedPublicSlug, Record<string, Visual>>> = {
  muhendislik: {
    "water-service": { asset: "engineering-connectors", className: "sv-image-contain" },
  },
  workshop: {
    "technical-validation": { asset: "engineering-automation" },
  },
  "nasil-calisir": {
    layout: { asset: "ufuk-day", className: "sv-image-contain" },
  },
  "uretim-sureci": {
    "technical-definition": { asset: "engineering-connectors", className: "sv-image-contain" },
    checks: { asset: "engineering-automation" },
  },
};

const heroAssets: Partial<Record<CuratedPublicSlug, PublicLaunchAssetId>> = {
  hakkimizda: "lounge",
  muhendislik: "engineering-automation",
  workshop: "exterior-landscape",
};

const heroRoles: Partial<Record<CuratedPublicSlug, PublicLaunchMediaRole>> = {
  hakkimizda: "editorial.about.hero",
  "karavan-deneyimi": "editorial.living.hero",
  muhendislik: "editorial.engineering.hero",
  workshop: "editorial.workshop.hero",
  "nasil-calisir": "editorial.process.hero",
  "uretim-sureci": "editorial.production.hero",
};

const sectionRoles: Record<CuratedPublicSlug, PublicLaunchMediaRole> = {
  hakkimizda: "editorial.about.section",
  "karavan-deneyimi": "editorial.living.section",
  muhendislik: "editorial.engineering.section",
  workshop: "editorial.workshop.section",
  "nasil-calisir": "editorial.process.section",
  "uretim-sureci": "editorial.production.section",
  sss: "editorial.general.section",
  iletisim: "editorial.general.section",
  "proje-baslat": "editorial.general.section",
};

function getSectionPresentation(page: PublicPageContent, sectionId: string) {
  const block = page.blocks.find(
    (candidate) => "editorial" in candidate && candidate.editorial?.sectionId === sectionId,
  );

  if (!block || !("editorial" in block) || !block.editorial) {
    return null;
  }

  return {
    presentation: block.editorial,
    media: "media" in block ? block.media : undefined,
  };
}

function EditorialVisual({ visual, locale }: { visual: Visual; locale: PublicPageContent["locale"] }) {
  const alt = getAssetAlt(visual.asset, locale);
  return <figure className="sv-editorial-figure">
    <PublicConceptMedia name={visual.asset} alt={alt} className={`sv-editorial-section-image ${visual.className ?? ""}`} />
    <figcaption className="sv-concept-label">{publicLaunchContent[locale].concept}</figcaption>
  </figure>;
}

function ManagedEditorialVisual({ media, locale }: { media: PublicBlockMedia; locale: PublicPageContent["locale"] }) {
  const focalPosition = media.focalPosition
    ? `${media.focalPosition.x}% ${media.focalPosition.y}%`
    : undefined;
  return <figure className="sv-editorial-figure">
    <div className="sv-image sv-editorial-section-image">
      <PublicMediaSurface
        media={media}
        visualClassName={media.fit === "contain" ? "!object-contain" : "!object-cover"}
        visualStyle={{ objectPosition: focalPosition }}
      />
    </div>
    <figcaption className="sv-concept-label">{publicLaunchContent[locale].concept}</figcaption>
  </figure>;
}

function RoofEvaluation({ locale }: { locale: PublicPageContent["locale"] }): React.JSX.Element {
  const text = locale === "tr" ? {
    eyebrow: "Değerlendirme çerçevesi", heading: "Çatı yerleşimi, iki ayrı doğrulama gerektirir.",
    items: [
      ["Fiziksel yerleşim", "Kullanılabilir çatı alanı, açıklıklar ve servis payları araç özelinde incelenir."],
      ["Elektriksel uyumluluk", "Panel yerleşimi, kablo yolu ve sistem gereksinimleri ayrı bir teknik sorudur."],
      ["Teknik değerlendirme", "Her iki başlık araç özelinde doğrulanır; nihai teknik ve ticari karar insan onayı gerektirir."],
    ],
  } : {
    eyebrow: "Evaluation framework", heading: "Roof planning requires two distinct validations.",
    items: [
      ["Physical placement", "Usable roof area, openings and service clearances are reviewed for the specific vehicle."],
      ["Electrical compatibility", "Panel placement, cable path and system requirements remain a separate technical question."],
      ["Technical review", "Both questions require vehicle-specific validation; final technical and commercial decisions require human approval."],
    ],
  };
  return <figure className="sv-roof-evaluation">
    <div className="sv-roof-evaluation-surface">
      <div className="sv-roof-evaluation-geometry" aria-hidden="true"><span /><span /><span /><i /></div>
      <div className="sv-roof-evaluation-copy"><p className="sv-eyebrow">{text.eyebrow}</p><h3>{text.heading}</h3><dl>{text.items.map(([term, description]) => <div key={term}><dt>{term}</dt><dd>{description}</dd></div>)}</dl></div>
    </div>
  </figure>;
}

function SectionBody({ section, index, slug, page }: { section: EditorialSection; index: number; slug: CuratedPublicSlug; page: PublicPageContent }) {
  const locale = page.locale;
  const visual = sectionVisuals[slug]?.[section.id];
  const isRoofEvaluation = slug === "muhendislik" && section.id === "roof-electrical-compatibility";
  const livingStudies = slug === "karavan-deneyimi" && section.id === "sleep" ? ["alcove"] as const
    : slug === "karavan-deneyimi" && section.id === "personal-space" ? ["toilet", "shower"] as const
      : undefined;
  const override = getSectionPresentation(page, section.id);
  const presentation: PublicEditorialPresentation | undefined = override?.presentation;
  const requestedRole = sectionRoles[slug];
  const approvedMedia = presentation?.visual === "media" && override?.media?.semanticRole === requestedRole
    ? getApprovedCmsLaunchMedia(override.media, { role: requestedRole })
    : null;
  const hasCuratedVisual = Boolean(visual || isRoofEvaluation || livingStudies);
  const resolvedVisual = resolveEditorialVisual({
    presentation,
    hasCuratedVisual,
    hasApprovedMedia: Boolean(approvedMedia),
  });
  const hasVisual = resolvedVisual !== "none";
  const mediaOnLeft = presentation?.layout === "media-left" || (!presentation?.layout && index % 2 === 1);
  const wideMedia = hasVisual && presentation?.layout === "wide-media";
  return <section id={section.id} data-editorial-visual={presentation?.visual ?? "inherit"} className={`sv-editorial-section ${hasVisual ? "sv-editorial-section-with-media" : "sv-editorial-section-text-only"} ${mediaOnLeft ? "sv-editorial-section-reverse" : ""} ${wideMedia ? "sv-editorial-section-wide-media" : ""}`}>
    <div className="sv-editorial-section-copy">
      <span className="sv-section-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <h2>{section.heading}</h2>
      <p>{section.body}</p>
      {section.bullets ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
    </div>
    {resolvedVisual === "managed" && approvedMedia ? <ManagedEditorialVisual media={approvedMedia} locale={locale} /> : resolvedVisual === "curated" && visual ? <EditorialVisual visual={visual} locale={locale} /> : resolvedVisual === "curated" && isRoofEvaluation ? <RoofEvaluation locale={locale} /> : resolvedVisual === "curated" && livingStudies ? <PublicLivingConceptStudies copy={publicLaunchContent[locale].product} locale={locale} images={[...livingStudies]} /> : null}
  </section>;
}

function WorkshopDecisionArchitecture({ copy, status }: {
  copy: NonNullable<(typeof publicEditorialContent)["tr"]["workshop"]["decisionArchitecture"]>;
  status: string | undefined;
}) {
  return <section id="workshop-decision-architecture" className="sv-container sv-section" aria-labelledby="workshop-decision-title">
    <div className="sv-workshop-architecture">
      <div className="sv-workshop-architecture-geometry" aria-hidden="true"><span /><span /><span /></div>
      <header><div><p className="sv-eyebrow">{copy.eyebrow}</p><h2 id="workshop-decision-title">{copy.heading}</h2></div><div><p>{copy.body}</p>{status ? <span className="sv-status">{status}</span> : null}</div></header>
      <ol>{copy.stages.map((stage, index) => <li key={stage.title}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.body}</p></li>)}</ol>
      <div className="sv-workshop-authority">{copy.authority.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
      <p className="sv-workshop-architecture-note">{copy.note}</p>
    </div>
  </section>;
}

function OnwardActions({ page, actions }: { page: PublicPageContent; actions: Array<{ label: string; slug: CuratedPublicSlug }> }) {
  return <div className="sv-editorial-actions">
    {actions.map((action) => action.slug === "proje-baslat"
      ? <PublicProjectAction key={action.slug} locale={page.locale} secondary />
      : <Link key={action.slug} className="sv-text-link" href={getLocalizedPath(page.locale, action.slug)}>{action.label}<ArrowUpRight size={17} aria-hidden="true" /></Link>)}
  </div>;
}

export function PublicEditorialPage({ page, children }: { page: PublicPageContent; children?: React.ReactNode }): React.JSX.Element {
  if (!isCuratedPublicSlug(page.slug)) {
    return <>{children}</>;
  }

  const slug = page.slug;
  const copy = publicEditorialContent[page.locale][slug];
  const launchCopy = publicLaunchContent[page.locale];
  const launchHero = getLaunchHero(page);
  const cmsHero = page.source === "admin" ? launchHero.copy : undefined;
  const heroAsset = heroAssets[slug];
  const heroRole = heroRoles[slug];
  const isCompact = slug === "sss" || slug === "iletisim" || slug === "proje-baslat";
  const isTextLedHero = !heroAsset;
  const isProjectStart = slug === "proje-baslat";

  return <main className={`sv-editorial sv-editorial-${page.slug}`}>
    <section className={`sv-editorial-page-hero ${isCompact ? "sv-editorial-page-hero-compact" : ""} ${isTextLedHero ? "sv-editorial-page-hero-text" : ""}`} aria-labelledby="editorial-title">
      <div className="sv-container sv-editorial-page-hero-grid">
        <div className="sv-editorial-copy">
          <div className="sv-editorial-kicker"><p className="sv-eyebrow">{copy.eyebrow}</p>{copy.status ? <span className="sv-status">{copy.status}</span> : null}</div>
          <h1 id="editorial-title">{cmsHero?.heading || copy.heading}</h1>
          <p>{cmsHero?.subtext || copy.body}</p>
          {cmsHero?.body ? <p>{cmsHero.body}</p> : null}
        </div>
        {heroAsset && !isCompact ? <figure className="sv-editorial-hero-figure">
          <PublicConceptMedia
            name={heroAsset}
            alt={getAssetAlt(heroAsset, page.locale)}
            className={`sv-editorial-page-hero-image ${heroAsset === "engineering-connectors" ? "sv-image-contain" : ""}`}
            sizes="(max-width: 767px) 100vw, 52vw"
            priority
            media={launchHero.media}
            mediaRole={heroRole ? { role: heroRole } : undefined}
          />
          <figcaption className="sv-concept-label">{launchCopy.concept}</figcaption>
        </figure> : null}
      </div>
    </section>

    {slug === "workshop" && copy.decisionArchitecture ? <WorkshopDecisionArchitecture copy={copy.decisionArchitecture} status={copy.status} /> : null}

    {slug === "karavan-deneyimi" ? <section className="sv-container sv-section sv-editorial-gallery" aria-labelledby="living-gallery-title">
      <p className="sv-eyebrow">{launchCopy.product.eyebrow}</p>
      <h2 id="living-gallery-title">{copy.sections[0].heading}</h2>
      <p className="sv-editorial-gallery-intro">{copy.sections[0].body}</p>
      <PublicLivingGallery copy={launchCopy.product} concept={launchCopy.concept} locale={page.locale} editorial />
      <p className="sv-disclaimer">{launchCopy.conceptNote}</p>
    </section> : null}

    {copy.faqGroups ? <div className="sv-container sv-editorial-faqs">
      {copy.faqGroups.map((group) => <section className="sv-faq sv-section" key={group.heading} aria-labelledby={`faq-${group.heading.replace(/\s+/g, "-").toLowerCase()}`}>
        <h2 id={`faq-${group.heading.replace(/\s+/g, "-").toLowerCase()}`}>{group.heading}</h2>
        {group.items.map((item) => <details key={item.question}><summary>{item.question}<span className="sv-disclosure-icon" aria-hidden="true" /></summary><p>{item.answer}</p></details>)}
      </section>)}
    </div> : <div className="sv-container sv-editorial-sections">
      {copy.sections.map((section, index) => slug === "karavan-deneyimi" && index === 0 ? null : <SectionBody key={section.id} section={section} index={index} slug={slug} page={page} />)}
    </div>}

    {copy.note && !isProjectStart ? <div className="sv-container"><p className="sv-editorial-note">{copy.note}</p></div> : null}

    {children ? <aside className="sv-published-copy" aria-label={page.locale === "tr" ? "Yayınlanmış ek içerik" : "Additional published content"}>{children}</aside> : null}

    <section className="sv-final" aria-labelledby="editorial-next-title">
      <div className="sv-container">
        <div><p className="sv-eyebrow">{isProjectStart ? page.locale === "tr" ? "Sonraki adım" : "Next step" : page.locale === "tr" ? "Keşfetmeye devam edin" : "Continue exploring"}</p><h2 id="editorial-next-title">{isProjectStart ? copy.note : page.locale === "tr" ? "Bir sonraki kararı bağlamıyla inceleyin." : "Explore the next decision in context."}</h2></div>
        <OnwardActions page={page} actions={copy.actions} />
      </div>
    </section>
  </main>;
}
