import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { publicLaunchContent, type PublicPageContent } from "../lib/launch-content";
import { publicLaunchAssets } from "../lib/public-launch-media";
import { getDefinitionBlock, getLaunchHero } from "../lib/public-launch-selection";
import { getPublicMediaForSlot, resolvePublicMediaSurfaces } from "../lib/public-media-surface";
import { getLocalizedPath } from "../lib/public-routing";
import { PublicConceptMedia } from "./PublicConceptMedia";
import { PublicHeroSequence } from "./PublicHeroSequence";
import { PublicMotion } from "./PublicMotion";
import { PublicProjectAction } from "./PublicProjectAction";
import styles from "./PublicLaunchPage.module.css";

const homeUi = {
  tr: {
    principlesEyebrow: "Skyvan yaklaşımı",
    principlesTitle: "Bir karavanı parçalara değil, tek bir yaşam sistemi olarak ele alıyoruz.",
    principles: [
      { number: "01", title: "Yaşam", body: "Rota, günlük ritim ve alanı paylaşan insanlar projenin başlangıç noktasıdır." },
      { number: "02", title: "Mühendislik", body: "Yerleşim, ağırlık, enerji, su ve servis erişimi birbirinden kopmadan değerlendirilir." },
      { number: "03", title: "Doğrulama", body: "Eksik bilgi sonuç gibi sunulmaz. Teknik kararlar doğrulanmış veri ve insan onayıyla ilerler." },
    ],
    livingEyebrow: "Karavan deneyimi",
    livingTitle: "Bir alan. Günün farklı anları.",
    livingBody: "Oturma, çalışma, dinlenme ve uyku aynı hacimde birbirini engellemeden yaşayabilmeli. Skyvan yaşam alanını sabit bir plan değil, gün boyunca değişen bir deneyim olarak ele alır.",
    livingCta: "Karavan deneyimini keşfedin",
    livingCaption: "Skyvan yaşam alanı konsepti",
    workshopEyebrow: "Skyvan Atölye",
    workshopBadge: "Canlı Proje Sistemi",
    workshopTitle: "Karavanınızı seçmeyin. Projenizi oluşturun.",
    workshopBody: "Atölye bir ürün listesi ya da basit bir konfigüratör değil. Araçtan yaşam düzenine, enerji ve su sistemlerinden bileşenlere kadar verdiğiniz her karar kendi Skyvan projenize işlenir.",
    workshopFlow: ["Aracını seç", "Yaşam alanını oluştur", "Sistemlerini belirle", "Teknik uyumluluğu gör", "Uzmanla tamamla"],
    workshopNote: "Atölye’de yaptığınız her seçim projenizin bir parçasıdır. Sistem seçimlerin teknik etkilerini açıklar ve uyarır; nihai teknik ve ticari karar insan onayında kalır.",
    workshopCta: "Canlı proje sistemini keşfedin",
    projectLabel: "PROJE: SKYVAN-001",
    projectLive: "CANLI",
    projectMetrics: [["Araç", "Seçiliyor"], ["Yerleşim", "Canlı plan"], ["Enerji", "Hesaplanıyor"], ["Teknik kontrol", "Aktif"]],
    engineeringEyebrow: "Mühendislik",
    engineeringTitle: "Görünmeyen sistem de tasarımın bir parçasıdır.",
    engineeringBody: "İyi bir yaşam alanının arkasında; enerji, su, ısı-yalıtım ve servis erişiminin birlikte çözüldüğü bir teknik omurga bulunur.",
    engineeringAreas: ["Enerji", "Su", "Isı & yalıtım", "Servis erişimi"],
    engineeringCta: "Mühendislik yaklaşımımız",
    finalEyebrow: "Skyvan'ı keşfedin",
    finalTitle: "Yaşam alanından mühendisliğe. Skyvan'ı bir bütün olarak keşfedin.",
    finalCta: "Skyvan'ı Keşfet",
    concept: "Skyvan konsept çalışması",
  },
  en: {
    principlesEyebrow: "The Skyvan approach",
    principlesTitle: "We treat a motorhome not as separate parts, but as one living system.",
    principles: [
      { number: "01", title: "Living", body: "Route, daily rhythm and the people sharing the space are the starting point of the project." },
      { number: "02", title: "Engineering", body: "Layout, mass, energy, water and service access are considered as connected decisions." },
      { number: "03", title: "Validation", body: "Missing information is not presented as a result. Technical decisions advance with verified data and human approval." },
    ],
    livingEyebrow: "Motorhome living",
    livingTitle: "One space. Different moments of the day.",
    livingBody: "Sitting, working, resting and sleeping should coexist without fighting for the same space. Skyvan treats the interior as an experience that changes through the day, not a fixed floor plan.",
    livingCta: "Explore motorhome living",
    livingCaption: "Skyvan living-space concept",
    workshopEyebrow: "Skyvan Workshop",
    workshopBadge: "Live Project System",
    workshopTitle: "Don’t choose a motorhome. Build your project.",
    workshopBody: "Workshop is not a product list or a simple configurator. From the vehicle and living layout to energy, water and components, every decision becomes part of your own Skyvan project.",
    workshopFlow: ["Choose vehicle", "Shape living space", "Define systems", "See technical compatibility", "Complete with an expert"],
    workshopNote: "Every choice you make in Workshop becomes part of your project. The system explains technical effects and warns; final technical and commercial decisions remain subject to human approval.",
    workshopCta: "Explore the live project system",
    projectLabel: "PROJECT: SKYVAN-001",
    projectLive: "LIVE",
    projectMetrics: [["Vehicle", "Selecting"], ["Layout", "Live plan"], ["Energy", "Calculating"], ["Technical check", "Active"]],
    engineeringEyebrow: "Engineering",
    engineeringTitle: "The system you do not see is part of the design.",
    engineeringBody: "Behind a good living space is a technical backbone where energy, water, thermal insulation and service access are solved together.",
    engineeringAreas: ["Energy", "Water", "Thermal & insulation", "Service access"],
    engineeringCta: "Our engineering approach",
    finalEyebrow: "Explore Skyvan",
    finalTitle: "From living space to engineering. Discover Skyvan as one connected whole.",
    finalCta: "Discover Skyvan",
    concept: "Skyvan concept study",
  },
} as const;

export function PublicLaunchPage({ page }: { page: PublicPageContent }): React.JSX.Element {
  const copy = publicLaunchContent[page.locale];
  const ui = homeUi[page.locale];
  const hero = getLaunchHero(page);
  const definition = getDefinitionBlock(page);
  const surfaces = resolvePublicMediaSurfaces(page);
  const engineeringMedia = getPublicMediaForSlot(surfaces, "homepage.visualTrust.media");

  return (
    <div className={`sv-launch ${styles.home}`}>
      <section className="sv-hero sv-hero-cinematic" aria-labelledby="launch-title">
        <PublicHeroSequence locale={page.locale} />
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

      <PublicMotion className={styles.story}>
        <section id="discover-skyvan" className={`sv-container ${styles.intro}`} data-sv-reveal aria-labelledby="home-intro-title">
          <p className="sv-eyebrow">{copy.definition.eyebrow}</p>
          <h2 id="home-intro-title">{definition?.heading || copy.definition.heading}</h2>
          <p>{definition?.body || definition?.content || copy.definition.body}</p>
        </section>

        <section className={styles.principles} data-sv-reveal aria-labelledby="home-principles-title">
          <div className="sv-container">
            <div className={styles.sectionLead}>
              <p className="sv-eyebrow">{ui.principlesEyebrow}</p>
              <h2 id="home-principles-title">{ui.principlesTitle}</h2>
            </div>
            <div className={styles.principleGrid}>
              {ui.principles.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="life-scenarios" className={`sv-container ${styles.living}`} data-sv-reveal aria-labelledby="home-living-title">
          <div className={styles.livingCopy}>
            <p className="sv-eyebrow">{ui.livingEyebrow}</p>
            <h2 id="home-living-title">{ui.livingTitle}</h2>
            <p>{ui.livingBody}</p>
            <Link className="sv-text-link" href={getLocalizedPath(page.locale, "karavan-deneyimi")}>{ui.livingCta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
          <figure className={styles.livingMedia}>
            <PublicConceptMedia name="lounge-table" alt={publicLaunchAssets["lounge-table"].alt[page.locale]} sizes="(max-width: 900px) 100vw, 58vw" />
            <figcaption><span>{ui.livingCaption}</span><span>01 / 03</span></figcaption>
          </figure>
        </section>

        <section id="workshop" className={styles.workshop} data-sv-reveal aria-labelledby="home-workshop-title">
          <div className={`sv-container ${styles.workshopFrame}`}>
            <div className={styles.workshopCopy}>
              <div className={styles.eyebrowRow}><p className="sv-eyebrow">{ui.workshopEyebrow}</p><span className={styles.liveBadge}><i aria-hidden="true" />{ui.workshopBadge}</span><span className="sv-status">{copy.upcoming}</span></div>
              <h2 id="home-workshop-title">{ui.workshopTitle}</h2>
              <p>{ui.workshopBody}</p>
              <p className={styles.workshopNote}>{ui.workshopNote}</p>
              <Link className="sv-text-link" href={getLocalizedPath(page.locale, "workshop")}>{ui.workshopCta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className={styles.projectPanel}>
              <div className={styles.projectHeader}><span>{ui.projectLabel}</span><strong><i aria-hidden="true" />{ui.projectLive}</strong></div>
              <div className={styles.projectMetrics}>{ui.projectMetrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
              <ol className={styles.flow}>{ui.workshopFlow.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></li>)}</ol>
            </div>
          </div>
        </section>

        <section id="engineering-confidence" className={`sv-container ${styles.engineering}`} data-sv-reveal aria-labelledby="home-engineering-title">
          <div className={styles.engineeringCopy}>
            <p className="sv-eyebrow">{ui.engineeringEyebrow}</p>
            <h2 id="home-engineering-title">{ui.engineeringTitle}</h2>
            <p>{ui.engineeringBody}</p>
            <div className={styles.engineeringAreas}>{ui.engineeringAreas.map((area, index) => <span key={area}><small>{String(index + 1).padStart(2, "0")}</small>{area}</span>)}</div>
            <Link className="sv-text-link" href={getLocalizedPath(page.locale, "muhendislik")}>{ui.engineeringCta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
          <figure className={styles.engineeringMedia}>
            <PublicConceptMedia name="electrical-rear-service" alt={publicLaunchAssets["electrical-rear-service"].alt[page.locale]} media={engineeringMedia} mediaRole={{ role: "launch.engineering" }} sizes="(max-width: 900px) 100vw, 55vw" />
            <figcaption><span>{ui.concept}</span><span>02 / 03</span></figcaption>
          </figure>
        </section>

        <section className={`sv-container ${styles.faq}`} data-sv-reveal aria-labelledby="home-faq-title">
          <div className={styles.faqLead}><p className="sv-eyebrow">{copy.faq.eyebrow}</p><h2 id="home-faq-title">{page.locale === "tr" ? "Merak edilenler, açık cevaplar." : "Common questions, clear answers."}</h2></div>
          <div>{copy.faq.items.map((item) => <details key={item.title}><summary>{item.title}<span className="sv-disclosure-icon" aria-hidden="true" /></summary><p>{item.body}</p></details>)}</div>
        </section>
      </PublicMotion>

      <section className={styles.final} aria-labelledby="home-final-title">
        <PublicConceptMedia name="exterior-landscape" alt="" className={styles.finalMedia} sizes="100vw" />
        <div className="sv-container">
          <div><p className="sv-eyebrow">{ui.finalEyebrow}</p><h2 id="home-final-title">{ui.finalTitle}</h2></div>
          <div className={styles.finalActions}>
            <Link className="sv-button" href={getLocalizedPath(page.locale, "karavan-deneyimi")}>{ui.finalCta}<ArrowUpRight size={15} aria-hidden="true" /></Link>
            <PublicProjectAction locale={page.locale} secondary />
          </div>
        </div>
      </section>
    </div>
  );
}
