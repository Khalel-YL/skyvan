import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { PublicPageContent } from "../lib/launch-content";
import { publicEditorialContent } from "../lib/public-editorial-content";
import { getLocalizedPath } from "../lib/public-routing";
import { PublicConceptMedia } from "./PublicConceptMedia";
import { PublicMotion } from "./PublicMotion";
import styles from "./PublicAboutPage.module.css";

type AboutLocale = PublicPageContent["locale"];

const aboutUi = {
  tr: {
    heroKicker: "SKYVAN / HAKKIMIZDA", heroMeta: "TASARIM · MÜHENDİSLİK · DİJİTAL SİSTEM",
    heroFoot: "Gerçek yapım deneyiminden, daha açık kararlara", originEyebrow: "Başlangıç noktası",
    originTitle: "Bir motokaravan yapmak, kararların birbirine ne kadar bağlı olduğunu gösterdi.",
    originBody: "Alan, malzeme, enerji, su ve servis erişimi ayrı başlıklar gibi görünür. Gerçekte birindeki karar diğerini değiştirir. Skyvan bu bağlantıları daha erken görünür kılma fikrinden doğdu.",
    principleEyebrow: "Skyvan yaklaşımı", principleTitle: "Görünen tasarım ile görünmeyen sistemi aynı bütünün parçası sayıyoruz.",
    principles: [
      { number: "01", title: "Yaşam önce gelir", body: "Proje bir ekipman listesinden değil; yolculuk biçimi, günlük kullanım ve alanı paylaşan insanlardan başlar." },
      { number: "02", title: "Teknik gerçek saklanmaz", body: "Ölçü, ağırlık, ürün verisi veya uygulama koşulu eksikse bunu sonuç gibi göstermeyiz. Açık soru, açık kalır." },
      { number: "03", title: "Servis de tasarımın parçasıdır", body: "Bir sistem yalnız ilk gün çalışmak için değil; kontrol, bakım ve gerektiğinde müdahale edilebilmek için düzenlenir." },
    ],
    connectedEyebrow: "Tek plan", digitalEyebrow: "Dijital uzantı",
    digitalTitle: "Atölye, bu düşünme biçimini müşterinin görebileceği bir karar akışına dönüştürüyor.",
    digitalBody: "Araç, yaşam alanı ve ürün seçimleri ileride tek proje bağlamında okunacak. Dijital sistem seçenekleri açıklayacak ve açık soruları gösterecek; nihai teknik ve ticari karar uzman incelemesi ve insan onayıyla kalacak.",
    responsibilityEyebrow: "Sorumluluk", responsibilityTitle: "Teknoloji yardımcı olur. Kararın sorumluluğu insanda kalır.",
    responsibilityBody: "Skyvan için dijital rehberlik; doğrulanmamış bir sonucu kesinmiş gibi sunmak değil, kararın dayanağını ve eksik bilgisini görünür kılmak demektir.",
    closeEyebrow: "Skyvan'ı keşfedin", closeTitle: "Yaşam alanından mühendisliğe, aynı düşünce çizgisini izleyin.",
    livingCta: "Karavan deneyimi", engineeringCta: "Mühendislik yaklaşımı", workshopCta: "Atölyeyi tanıyın", concept: "Skyvan konsept çalışması",
  },
  en: {
    heroKicker: "SKYVAN / ABOUT", heroMeta: "DESIGN · ENGINEERING · DIGITAL SYSTEM",
    heroFoot: "From hands-on building to clearer decisions", originEyebrow: "Where it began",
    originTitle: "Building a motorhome revealed how tightly every decision is connected.",
    originBody: "Space, materials, energy, water and service access may look like separate subjects. In practice, a decision in one changes the others. Skyvan grew from the idea of making those connections visible earlier.",
    principleEyebrow: "The Skyvan approach", principleTitle: "We treat visible design and the system behind it as one connected whole.",
    principles: [
      { number: "01", title: "Living comes first", body: "A project begins with the way people travel, use the space and live together — not with an equipment list." },
      { number: "02", title: "Technical reality stays visible", body: "If a dimension, mass, product value or installation condition is missing, we do not present it as a result. An open question stays open." },
      { number: "03", title: "Service is part of design", body: "A system is arranged not only to work on day one, but to remain inspectable, maintainable and accessible when intervention is needed." },
    ],
    connectedEyebrow: "One plan", digitalEyebrow: "Digital extension",
    digitalTitle: "Workshop turns this way of thinking into a decision flow customers can see.",
    digitalBody: "Vehicle, living-space and product choices will be read in one project context. The digital system will explain options and surface open questions; final technical and commercial decisions remain subject to expert review and human approval.",
    responsibilityEyebrow: "Responsibility", responsibilityTitle: "Technology assists. People remain responsible for the decision.",
    responsibilityBody: "For Skyvan, digital guidance means making the basis of a decision — and any missing information — visible rather than presenting an unverified result as certain.",
    closeEyebrow: "Explore Skyvan", closeTitle: "Follow the same line of thinking from living space to engineering.",
    livingCta: "Motorhome living", engineeringCta: "Engineering approach", workshopCta: "Explore Workshop", concept: "Skyvan concept study",
  },
} as const;

function Caption({ locale, index }: { locale: AboutLocale; index: string }) {
  return <figcaption className={styles.caption}><span>{aboutUi[locale].concept}</span><span>{index}</span></figcaption>;
}

export function PublicAboutPage({ page }: { page: PublicPageContent }): React.JSX.Element {
  const locale = page.locale;
  const ui = aboutUi[locale];
  const copy = publicEditorialContent[locale].hakkimizda;
  const title = page.editorialPage?.title || copy.heading;
  const introduction = page.editorialPage?.introduction || copy.body;
  const connected = copy.sections.find((section) => section.id === "living-space-and-engineering")!;
  const service = copy.sections.find((section) => section.id === "organized-service-access")!;

  return <main className={styles.about}>
    <section className={styles.hero} aria-labelledby="about-title">
      <div className={styles.heroMedia} aria-hidden="true"><PublicConceptMedia name="exterior-landscape" alt="" sizes="100vw" priority /></div>
      <div className={`sv-container ${styles.heroFrame}`}>
        <div className={styles.heroTopline}><span>{ui.heroKicker}</span><span>01 / 05</span></div>
        <div className={styles.heroCopy}><p className="sv-eyebrow">{ui.heroMeta}</p><h1 id="about-title">{title}</h1><p>{introduction}</p></div>
        <div className={styles.heroFoot}><span>{ui.heroFoot}</span><span>SKYVAN / 2026</span></div>
      </div>
    </section>

    <PublicMotion className={styles.story}>
      <section className={`sv-container ${styles.origin}`} data-sv-reveal aria-labelledby="about-origin-title">
        <div className={styles.originCopy}><span className={styles.number}>02</span><p className="sv-eyebrow">{ui.originEyebrow}</p><h2 id="about-origin-title">{ui.originTitle}</h2><p>{ui.originBody}</p></div>
        <figure className={styles.originMedia}><PublicConceptMedia name="interior-first-view" alt={locale === "tr" ? "Skyvan yaşam alanı konsepti." : "Skyvan living-space concept."} sizes="(max-width: 767px) 100vw, 58vw" /><Caption locale={locale} index="02 / 05" /></figure>
      </section>

      <section className={styles.principles} data-sv-reveal aria-labelledby="about-principles-title">
        <div className={`sv-container ${styles.principlesFrame}`}>
          <div className={styles.principlesIntro}><p className="sv-eyebrow">{ui.principleEyebrow}</p><h2 id="about-principles-title">{ui.principleTitle}</h2></div>
          <div className={styles.principleGrid}>{ui.principles.map((p) => <article key={p.number}><span>{p.number}</span><h3>{p.title}</h3><p>{p.body}</p></article>)}</div>
        </div>
      </section>

      <section className={`sv-container ${styles.connected}`} data-sv-reveal aria-labelledby="about-connected-title">
        <figure className={styles.connectedMedia}><PublicConceptMedia name="electrical-rear-service" alt={locale === "tr" ? "Skyvan servis erişimi ve elektrik düzeni konsepti." : "Skyvan service-access and electrical-layout concept."} sizes="(max-width: 767px) 100vw, 55vw" /><Caption locale={locale} index="03 / 05" /></figure>
        <div className={styles.connectedCopy}><span className={styles.number}>03</span><p className="sv-eyebrow">{ui.connectedEyebrow}</p><h2 id="about-connected-title">{connected.heading}</h2><p>{connected.body}</p><div className={styles.serviceNote}><span>{service.heading}</span><p>{service.body}</p></div></div>
      </section>

      <section className={styles.digital} data-sv-reveal aria-labelledby="about-digital-title">
        <div className={`sv-container ${styles.digitalFrame}`}>
          <div className={styles.digitalCopy}><span className={styles.number}>04</span><p className="sv-eyebrow">{ui.digitalEyebrow}</p><h2 id="about-digital-title">{ui.digitalTitle}</h2><p>{ui.digitalBody}</p></div>
          <figure className={styles.digitalMedia}><PublicConceptMedia name="control-centre" alt={locale === "tr" ? "Skyvan kontrol merkezi konsepti." : "Skyvan control-centre concept."} sizes="(max-width: 767px) 100vw, 54vw" /><Caption locale={locale} index="04 / 05" /></figure>
        </div>
      </section>

      <section className={`sv-container ${styles.responsibility}`} data-sv-reveal aria-labelledby="about-responsibility-title">
        <span className={styles.number}>05</span><div><p className="sv-eyebrow">{ui.responsibilityEyebrow}</p><h2 id="about-responsibility-title">{ui.responsibilityTitle}</h2></div><p>{ui.responsibilityBody}</p>
      </section>
    </PublicMotion>

    <section className={styles.closing} aria-labelledby="about-next-title">
      <div className={`sv-container ${styles.closingFrame}`}>
        <div><p className="sv-eyebrow">{ui.closeEyebrow}</p><h2 id="about-next-title">{ui.closeTitle}</h2></div>
        <div className={styles.actions}>
          <Link className="sv-text-link" href={getLocalizedPath(locale, "karavan-deneyimi")}>{ui.livingCta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link className="sv-text-link" href={getLocalizedPath(locale, "muhendislik")}>{ui.engineeringCta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link className="sv-text-link" href={getLocalizedPath(locale, "workshop")}>{ui.workshopCta}<ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  </main>;
}
