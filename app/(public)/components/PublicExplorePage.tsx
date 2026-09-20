import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { PublicPageContent } from "../lib/launch-content";
import { publicEditorialContent } from "../lib/public-editorial-content";
import { publicLaunchContent } from "../lib/public-launch-copy";
import { getLocalizedPath } from "../lib/public-routing";
import { PublicConceptMedia } from "./PublicConceptMedia";
import { PublicLivingConceptStudies, PublicLivingGallery } from "./PublicLivingGallery";
import { PublicMotion } from "./PublicMotion";
import styles from "./PublicExplorePage.module.css";

export function PublicExplorePage({ page }: { page: PublicPageContent }): React.JSX.Element {
  const locale = page.locale;
  const copy = publicEditorialContent[locale]["karavan-deneyimi"];
  const launchCopy = publicLaunchContent[locale];
  const [living, sleep, kitchen, personalSpace, storage] = copy.sections;
  const concept = locale === "tr" ? "Skyvan konsept çalışması" : "Skyvan concept study";

  return <main className={styles.explore}>
    <section className={styles.hero} aria-labelledby="explore-title">
      <div className={styles.heroMedia}><PublicConceptMedia name="interior-first-view" alt={locale === "tr" ? "Skyvan yaşam alanı, U oturum ve mutfak konsepti." : "Skyvan living space concept with a U lounge and galley."} sizes="100vw" priority /></div>
      <div className={`sv-container ${styles.heroFrame}`}>
        <div className={styles.heroCopy}>
          <div className={styles.meta}><span>{copy.eyebrow}</span><span>01 / 05</span></div>
          <p className="sv-eyebrow">{locale === "tr" ? "Yaşam alanı" : "Living space"}</p>
          <h1 id="explore-title">{page.editorialPage?.title || copy.heading}</h1>
          <p>{page.editorialPage?.introduction || copy.body}</p>
        </div>
        <div className={styles.heroFoot}><span>{locale === "tr" ? "Bir yaşam ritmi" : "A rhythm for living"}</span><span className="sv-concept-label">{concept}</span></div>
      </div>
    </section>

    <PublicMotion className={styles.story}>
      <section className={`sv-container ${styles.opening}`} data-sv-reveal aria-labelledby="explore-living-title">
        <header><span>01</span><div><p className="sv-eyebrow">{locale === "tr" ? "Bir yaşam ritmi" : "A rhythm for living"}</p><h2 id="explore-living-title">{living.heading}</h2></div><p>{living.body}</p></header>
        <figure><PublicConceptMedia name="lounge-table" alt={locale === "tr" ? "Skyvan U oturumunda masa ve beraber vakit geçirme alanı konsepti." : "Skyvan U lounge concept with table and shared living area."} sizes="(max-width: 767px) 100vw, 90vw" /><figcaption><span className="sv-concept-label">{concept}</span><span>{locale === "tr" ? "Ortak alan" : "Shared space"}</span></figcaption></figure>
      </section>

      <section className={styles.rhythm} data-sv-reveal aria-labelledby="explore-rhythm-title">
        <div className={`sv-container ${styles.rhythmHeading}`}><div><span>02</span><p className="sv-eyebrow">{locale === "tr" ? "Gündüzden geceye" : "From day into night"}</p><h2 id="explore-rhythm-title">{sleep.heading}</h2></div><p>{sleep.body}</p></div>
        <div className="sv-container"><PubliLivingGallery copy={launchCopy.product} concept={launchCopy.product} locale={locale} editorial /></div>
      </section>

      <section className={`sv-container ${styles.kitchen}`} data-sv-reveal aria-labelledby="explore-kitchen-title">
        <figure><PublicConceptMedia name="kitchen-transition" alt={locale === "tr" ? "Skyvan mutfak, dolaşım ve oturma alanı konsepti." : "Skyvan galley, circulation and lounge concept."} sizes="(max-width: 767px) 100vw, 52vw" /><figcaption><span>03</span><span className="sv-concept-label">{concept}</span></figcaption></figure>
        <div><p className="sv-eyebrow">{locale === "tr" ? "Akış" : "Flow"}</p><h2 id="explore-kitchen-title">{kitchen.heading}</h2><p>{kitchen.body}</p></div>
      </section>

      <section className={`sv-container ${styles.private}`} data-sv-reveal aria-labelledby="explore-private-title">
        <div><span>04</span><p className="sv-eyebrow">{locale === "tr" ? "Kişisel alan" : "Personal space"}</p><h2 id="explore-private-title">{personalSpace.heading}</h2><p>{personalSpace.body}</p></div>
        <PublicLivingConceptStudies copy={launchCopy.product} locale={locale} images={["toilet", "shower"]} />
      </section>

      <section className={`sv-container ${styles.quiet}`} data-sv-reveal aria-labelledby="explore-storage-title">
        <span>05</span><div><p className="sv-eyebrow">{locale === "tr" ? "Sonraki bölüm" : "Next chapter"}</p><h2 id="explore-storage-title">{storage.heading}</h2></div><div><p>{storage.body}</p><Link className="sv-text-link" href={getLocalizedPath(locale, "muhendislik")}>{locale === "tr" ? "Mühendislik yaklışımını inceleyin" : "Explore the engineering approach"}<ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      </section>
    </PublicMotion>

    <section className="sv-final" aria-labelledby="explore-next-title"><div className="sv-container"><div><p className="sv-eyebrow">{locale === "tr" ? "Devam edin" : "Continue"}</p><h2 id="explore-next-title">{locale === "tr" ? "Yaşam alanını mümkün kılan sistemi inceleyin." : "Explore the system that makes the living space possible."}</h2></div><Link className="sv-text-link" href={getLocalizedPath(locale, "muhendislik")}>{locale === "tr" ? "Mühendislik" : "Engineering"}<ArrowUpRight size={17} aria-hidden="true" /></Link></div></section>
  </main>;
}
