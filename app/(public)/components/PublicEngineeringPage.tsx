import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { PublicPageContent } from "../lib/launch-content";
import { publicLaunchContent } from "../lib/public-launch-copy";
import { getLocalizedPath } from "../lib/public-routing";
import { PublicConceptMedia } from "./PublicConceptMedia";
import { PublicMotion } from "./PublicMotion";
import { PublicTechnicalDiagram } from "./PublicTechnicalDiagram";
import styles from "./PublicEngineeringPage.module.css";

type EngineeringCopy = {
  eyebrow: string;
  heroTitle: string;
  heroBody: string;
  thesis: string;
  thesisBody: string;
  energy: { eyebrow: string; title: string; body: string; points: string[] };
  water: { eyebrow: string; title: string; body: string; points: string[] };
  envelope: { eyebrow: string; title: string; body: string };
  control: { eyebrow: string; title: string; body: string };
  close: { eyebrow: string; title: string; body: string; cta: string };
  concept: string;
};

const copy: Record<"tr" | "en", EngineeringCopy> = {
  tr: {
    eyebrow: "Skyvan mühendislik yaklaşımı",
    heroTitle: "Görünen şey, üretilebilir olmalı.",
    heroBody:
      "Bir yaşam alanı; aracın ölçüleri, ağırlık dengesi, enerji, su ve bakım erişimiyle aynı anda düşünülür.",
    thesis: "İyi görünen bir çözüm, bakım günü de iyi çalışmalıdır.",
    thesisBody:
      "Skyvan’da yerleşim, görünmeyen sistemlerden bağımsız ele alınmaz. Her kararın araç üzerinde bir yeri, bir servis yolu ve doğrulanacak bir teknik bağlamı vardır.",
    energy: {
      eyebrow: "Enerji ve çatı",
      title: "Çatıdaki alan, elektrik sisteminden önce okunur.",
      body:
        "Panel yüzeyi; heki, klima, kablo geçişi ve servis alanıyla birlikte değerlendirilir. Ardından PV gerilimi, akım, kablo güzergâhı ve koruma zinciri gerçek ürün dokümanlarıyla doğrulanır.",
      points: ["Fiziksel yerleşim", "Koruma ve kablo yolu", "Erişilebilir servis bölmesi"],
    },
    water: {
      eyebrow: "Su ve servis",
      title: "Temiz bir akış, görünür bakım noktalarıyla başlar.",
      body:
        "Temiz su, pompa, filtre, manifold ve gri su; mobilyanın arkasında kaybolan parçalar değil, servis erişimi korunmuş bir sistem olarak yerleşir.",
      points: ["Tank ve denge", "Filtre ile hidrofor", "Manifold ve izolasyon"],
    },
    envelope: {
      eyebrow: "Isı, ses ve yapı",
      title: "Katmanlar yalnızca konfor için değil, bütünlük için seçilir.",
      body:
        "Alkoven kabuğu, yalıtım çekirdeği ve iç kaplama; ısı köprüleri, akustik davranış, nem ve servis kanallarıyla birlikte değerlendirilir. Nihai malzeme bileşimi proje ölçüleriyle doğrulanır.",
    },
    control: {
      eyebrow: "Kontrol ve erişim",
      title: "Karmaşık sistem, kullanıcı için anlaşılır kalmalı.",
      body:
        "Enerji takibi, su seviye bilgisi, sigortalar ve vanalar; günlük kullanımda anlaşılır, servis gerektiğinde erişilebilir olmalıdır. Bir ekran, devreye alma ve fiziksel kontrollerin yerine geçmez.",
    },
    close: {
      eyebrow: "Sonraki adım",
      title: "Teknik kararlar, birbirinden ayrı verilmez.",
      body:
        "Atölye; araç, yaşam alanı ve teknik bileşen seçimlerinin birbirini nasıl etkilediğini açıklayan gelecekteki Skyvan deneyimidir. Nihai uygunluk ve ticari kararlar uzman incelemesiyle verilir.",
      cta: "Atölye yaklaşımını inceleyin",
    },
    concept: "Konsept tasarım / Concept study",
  },
  en: {
    eyebrow: "Skyvan engineering approach",
    heroTitle: "What you see must be buildable.",
    heroBody:
      "A living space is considered alongside vehicle dimensions, weight balance, energy, water and service access.",
    thesis: "A solution that looks right should also work on a service day.",
    thesisBody:
      "At Skyvan, layout is not separated from the systems behind it. Every decision has a place on the vehicle, a service route and a technical context that still needs verification.",
    energy: {
      eyebrow: "Energy and roof",
      title: "Roof space is read before the electrical system.",
      body:
        "Panel area is considered with rooflights, air-conditioning, cable entries and service clearance. PV voltage, current, cable route and protection are then verified against real product documentation.",
      points: ["Physical placement", "Protection and cable route", "Accessible service bay"],
    },
    water: {
      eyebrow: "Water and service",
      title: "A clean flow begins with visible service points.",
      body:
        "Fresh water, pump, filter, manifold and grey water are not parts lost behind furniture; they form a system with preserved service access.",
      points: ["Tank and balance", "Filter and pressure pump", "Manifold and isolation"],
    },
    envelope: {
      eyebrow: "Thermal, acoustic and structure",
      title: "Layers are selected for integrity, not comfort alone.",
      body:
        "The overcab shell, insulation core and interior lining are considered together with thermal bridges, acoustic behaviour, moisture and service routes. The final material build-up is verified against project dimensions.",
    },
    control: {
      eyebrow: "Control and access",
      title: "A complex system should remain clear to use.",
      body:
        "Energy monitoring, tank information, fuses and valves need to be understandable in daily use and accessible when service is needed. A display never replaces commissioning and physical checks.",
    },
    close: {
      eyebrow: "Next step",
      title: "Technical decisions are never made in isolation.",
      body:
        "Workshop is Skyvan’s future experience for explaining how vehicle, living-space and technical choices affect one another. Final compatibility and commercial decisions require expert review.",
      cta: "Explore the Workshop approach",
    },
    concept: "Concept design / Concept study",
  },
};

function ConceptCaption({ text }: { text: string }) {
  return <figcaption className={styles.conceptCaption}>{text}</figcaption>;
}

function EngineeringStatus({ locale }: { locale: PublicPageContent["locale"] }) {
  const content = locale === "tr"
    ? {
      label: "Konsept / proje verisiyle doğrulanır",
      title: "Şemalar yaklaşımı açıklar; ölçülü yerleşim değildir.",
      body: "Araç modeli, gerçek ürün datasheet’i, kütle, enerji ve servis ölçüleri seçilmeden uygunluk sonucu üretilmez.",
    }
    : {
      label: "Concept / verified with project data",
      title: "The studies explain the approach; they are not scaled layouts.",
      body: "No compatibility result is produced before the vehicle, real product datasheets, mass, energy and service dimensions are selected.",
    };

  return <aside className="sv-editorial-technical-status" role="note">
    <span>{content.label}</span>
    <strong>{content.title}</strong>
    <p>{content.body}</p>
  </aside>;
}

export function PublicEngineeringPage({ page }: { page: PublicPageContent }): React.JSX.Element {
  const locale = page.locale;
  const text = copy[locale];
  const title = page.editorialPage?.title || text.heroTitle;
  const body = page.editorialPage?.introduction || text.heroBody;
  const conceptNote = publicLaunchContent[locale].conceptNote;

  return (
    <main className={styles.engineering} id="public-main">
      <section className={styles.hero} aria-labelledby="engineering-title">
        <div className={styles.heroMedia} aria-hidden="true">
          <PublicConceptMedia
            name="roof-equipment"
            alt=""
            priority
            sizes="100vw"
          />
        </div>
        <div className={`sv-container ${styles.heroFrame}`}>
          <div className={styles.heroCopy}>
            <p className="sv-eyebrow">{text.eyebrow}</p>
            <h1 id="engineering-title">{title}</h1>
            <p>{body}</p>
            <EngineeringStatus locale={locale} />
          </div>
          <div className={styles.heroMeta}>
            <span>01 / 05</span>
            <span>{text.concept}</span>
          </div>
        </div>
      </section>

      <PublicMotion className={styles.story}>
        <section className={`sv-container ${styles.thesis}`} data-sv-reveal aria-labelledby="engineering-thesis-title">
          <p className="sv-eyebrow">{locale === "tr" ? "Tek bir bütün" : "One connected whole"}</p>
          <div>
            <h2 id="engineering-thesis-title">{text.thesis}</h2>
            <p>{text.thesisBody}</p>
          </div>
        </section>

        <section className={`sv-container ${styles.balance}`} data-sv-reveal aria-label={locale === "tr" ? "Yük ve denge teknik çalışması" : "Load and balance technical study"}>
          <PublicTechnicalDiagram kind="load-aero" locale={locale} />
        </section>

        <section className={`sv-container ${styles.energy}`} data-sv-reveal aria-labelledby="engineering-energy-title">
          <figure className={styles.energyMedia}>
            <PublicConceptMedia
              name="electrical-rear-service"
              alt={locale === "tr" ? "Skyvan arka elektrik servis bölmesi konsepti." : "Skyvan rear electrical service compartment concept."}
              sizes="(max-width: 767px) 100vw, 61vw"
            />
            <ConceptCaption text={text.concept} />
          </figure>
          <div className={styles.energyCopy}>
            <span className={styles.number}>02</span>
            <p className="sv-eyebrow">{text.energy.eyebrow}</p>
            <h2 id="engineering-energy-title">{text.energy.title}</h2>
            <p>{text.energy.body}</p>
            <ul>{text.energy.points.map((point) => <li key={point}>{point}</li>)}</ul>
          </div>
          <div className={styles.energyPlate}>
            <PublicTechnicalDiagram kind="solar-electrical" locale={locale} />
          </div>
        </section>

        <section className={styles.water} data-sv-reveal aria-labelledby="engineering-water-title">
          <div className={`sv-container ${styles.waterFrame}`}>
            <div className={styles.waterIntro}>
              <span className={styles.number}>03</span>
              <p className="sv-eyebrow">{text.water.eyebrow}</p>
              <h2 id="engineering-water-title">{text.water.title}</h2>
              <p>{text.water.body}</p>
              <ol>{text.water.points.map((point, index) => <li key={point}><span>{String(index + 1).padStart(2, "0")}</span>{point}</li>)}</ol>
            </div>
            <figure className={styles.waterMedia}>
              <PublicConceptMedia
                name="water-clean-service"
                alt={locale === "tr" ? "Skyvan temiz su servis ve filtre alanı konsepti." : "Skyvan fresh-water service and filtration area concept."}
                sizes="(max-width: 767px) 100vw, 62vw"
              />
              <ConceptCaption text={text.concept} />
            </figure>
            <figure className={styles.waterDetail}>
              <PublicConceptMedia
                name="engineering-water-manifold"
                alt={locale === "tr" ? "Skyvan su dağıtım manifoldu konsept çalışması." : "Skyvan water-distribution manifold concept study."}
                sizes="(max-width: 767px) 82vw, 35vw"
              />
              <ConceptCaption text={text.concept} />
            </figure>
            <div className={styles.waterPlate}>
              <PublicTechnicalDiagram kind="water-service" locale={locale} />
            </div>
          </div>
        </section>

        <section className={`sv-container ${styles.envelope}`} data-sv-reveal aria-labelledby="engineering-envelope-title">
          <div className={styles.envelopeCopy}>
            <span className={styles.number}>04</span>
            <p className="sv-eyebrow">{text.envelope.eyebrow}</p>
            <h2 id="engineering-envelope-title">{text.envelope.title}</h2>
            <p>{text.envelope.body}</p>
          </div>
          <figure className={styles.envelopeMedia}>
            <PublicConceptMedia
              name="alcove-layers"
              alt={locale === "tr" ? "Skyvan alkoven yapısında dört katmanlı malzeme konsepti." : "Skyvan overcab structure with a four-layer material concept."}
              sizes="(max-width: 767px) 100vw, 70vw"
            />
            <ConceptCaption text={text.concept} />
          </figure>
        </section>

        <section className={`sv-container ${styles.control}`} data-sv-reveal aria-labelledby="engineering-control-title">
          <figure className={styles.controlMedia}>
            <PublicConceptMedia
              name="control-centre"
              alt={locale === "tr" ? "Skyvan kontrol merkezi konsepti." : "Skyvan control-centre concept."}
              sizes="(max-width: 767px) 100vw, 51vw"
            />
            <ConceptCaption text={text.concept} />
          </figure>
          <div>
            <span className={styles.number}>05</span>
            <p className="sv-eyebrow">{text.control.eyebrow}</p>
            <h2 id="engineering-control-title">{text.control.title}</h2>
            <p>{text.control.body}</p>
          </div>
          <div className={styles.controlPlate}>
            <PublicTechnicalDiagram kind="service-access" locale={locale} />
          </div>
        </section>
      </PublicMotion>

      <section className={styles.closing} aria-labelledby="engineering-next-title">
        <div className={`sv-container ${styles.closingFrame}`}>
          <div>
            <p className="sv-eyebrow">{text.close.eyebrow}</p>
            <h2 id="engineering-next-title">{text.close.title}</h2>
          </div>
          <div>
            <p>{text.close.body}</p>
            <Link className="sv-text-link" href={getLocalizedPath(locale, "workshop")}>
              {text.close.cta}<ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <p className={`sv-container ${styles.disclaimer}`}>{conceptNote}</p>
      </section>
    </main>
  );
}
