import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publicLaunchContent, type PublicPageContent } from "../lib/launch-content";
import { publicLaunchAssets } from "../lib/public-launch-media";
import { getDefinitionBlock, getLaunchHero } from "../lib/public-launch-selection";
import { getPublicMediaForSlot, resolvePublicMediaSurfaces } from "../lib/public-media-surface";
import { getLocalizedPath } from "../lib/public-routing";
import { PublicConceptMedia, PublicVehicleMedia } from "./PublicConceptMedia";
import { PublicLivingGallery } from "./PublicLivingGallery";
import { PublicProjectAction } from "./PublicProjectAction";

export function PublicLaunchPage({ page }: { page: PublicPageContent }): React.JSX.Element {
  const copy = publicLaunchContent[page.locale];
  const hero = getLaunchHero(page);
  const definition = getDefinitionBlock(page);
  const surfaces = resolvePublicMediaSurfaces(page);
  const engineeringMedia = getPublicMediaForSlot(surfaces, "homepage.visualTrust.media");
  return (
    <div className="sv-launch">
      <section className="sv-hero" aria-labelledby="launch-title">
        <PublicVehicleMedia alt={copy.media.vehicle} media={hero.media} />
        <div className="sv-container sv-hero-content">
          <p className="sv-eyebrow">{copy.hero.eyebrow}</p>
          <h1 id="launch-title">{hero.copy?.heading || copy.hero.heading}</h1>
          <p className="sv-hero-description">{hero.copy?.subtext || copy.hero.subtext}</p>
          {hero.copy?.body ? <p className="sv-hero-body">{hero.copy.body}</p> : null}
          <div className="sv-actions">
            <Link className="sv-button" href={getLocalizedPath(page.locale, "karavan-deneyimi")}>{copy.hero.primaryCta}<ArrowUpRight size={15} aria-hidden="true" /></Link>
            <PublicProjectAction locale={page.locale} secondary />
          </div>
        </div>
        <div className="sv-container sv-hero-bottom"><span>{copy.hero.footnote}</span><span>{copy.concept}</span></div>
      </section>
      <section id="discover-skyvan" className="sv-container sv-introduction" aria-labelledby="introduction-title">
        <div><p className="sv-eyebrow">{copy.definition.eyebrow}</p><h2 id="introduction-title">{definition?.heading || copy.definition.heading}</h2></div>
        <p>{definition?.body || definition?.content || copy.definition.body}</p>
      </section>
      <section className="sv-container sv-section sv-differentiation" aria-labelledby="differentiation-title">
        <header className="sv-differentiation-header">
          <div><p className="sv-eyebrow">{copy.differentiation.eyebrow}</p><h2 id="differentiation-title">{copy.differentiation.heading}</h2></div>
          <p>{copy.differentiation.body}</p>
        </header>
        <div className="sv-differentiation-list">
          {copy.differentiation.items.map((item, index) => <article id={item.id} className="sv-differentiation-item" key={item.id}>
            <span className="sv-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <div><p>{item.body}</p><Link href={getLocalizedPath(page.locale, item.slug)} className="sv-text-link">{item.linkLabel}<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          </article>)}
        </div>
      </section>
      <section id="life-scenarios" className="sv-container sv-section sv-living" aria-labelledby="living-title">
        <div className="sv-section-line"><span>{copy.product.eyebrow}</span><span aria-hidden="true" /></div>
        <div className="sv-section-heading"><h2 id="living-title">{copy.product.heading}</h2><p>{copy.product.body}</p></div>
        <PublicLivingGallery copy={copy.product} concept={copy.concept} locale={page.locale} />
        <p className="sv-disclaimer">{copy.conceptNote}</p>
        <Link href={getLocalizedPath(page.locale, "karavan-deneyimi")} className="sv-text-link">{copy.product.cta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
      </section>
      <section id="workshop" className="sv-workshop sv-section" aria-labelledby="workshop-title">
        <div className="sv-container">
          <div className="sv-section-line"><span>{copy.workshop.eyebrow}</span><span aria-hidden="true" /><span className="sv-status">{copy.upcoming}</span></div>
          <div className="sv-section-heading"><h2 id="workshop-title">{copy.workshop.heading}</h2><p>{copy.workshop.body}</p></div>
          <ol className="sv-steps">{copy.workshop.steps.map((step, index) => <li key={step.title}><span className="sv-step-number">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
          <p className="sv-workshop-note">{copy.workshop.note}</p>
          <Link href={getLocalizedPath(page.locale, "sistem")} className="sv-text-link">{copy.workshop.cta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
      <section id="engineering-confidence" className="sv-container sv-section" aria-labelledby="engineering-title">
        <div className="sv-section-line"><span>{copy.engineering.eyebrow}</span><span aria-hidden="true" /></div>
        <div className="sv-engineering-split">
          <div><h2 id="engineering-title">{copy.engineering.heading}</h2><p>{copy.engineering.body}</p><p className="sv-approval">{copy.engineering.approval}</p><Link href={getLocalizedPath(page.locale, "muhendislik")} className="sv-text-link">{copy.engineering.cta}<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
          <figure><PublicConceptMedia name="engineering-automation" alt={publicLaunchAssets["engineering-automation"].alt[page.locale]} className="sv-engineering-image" media={engineeringMedia} mediaRole={{ role: "launch.engineering" }} /><figcaption className="sv-concept-label">{copy.concept}</figcaption></figure>
        </div>
      </section>
      <section className="sv-container sv-section sv-faq" aria-labelledby="faq-title">
        <div className="sv-section-line"><h2 id="faq-title">{copy.faq.eyebrow}</h2><span aria-hidden="true" /></div>
        {copy.faq.items.map((item) => <details key={item.title}><summary>{item.title}<span className="sv-disclosure-icon" aria-hidden="true" /></summary><p>{item.body}</p></details>)}
      </section>
      <section className="sv-final" aria-labelledby="final-title">
        <PublicConceptMedia name="exterior-landscape" alt="" className="sv-final-media" sizes="100vw" />
        <div className="sv-container"><div><p className="sv-eyebrow">{copy.final.eyebrow}</p><h2 id="final-title">{copy.final.heading}</h2></div><PublicProjectAction locale={page.locale} /></div>
      </section>
    </div>
  );
}
