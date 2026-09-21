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

type ExploreLocale = PublicPageContent["locale"];

const exploreUi = {
  tr: {
    heroKicker: "Skyvan karavan deneyimi",
    heroMeta: "DIŞARIDAN İÇERİYE",
    heroFoot: "Yaşam · dönüşüm · kişisel alan",
    arrivalEyebrow: "İlk karşılaşma",
    arrivalTitle: "Dışarıdaki hacim, içeride akışa dönüşür.",
    arrivalBody:
      "Karavan deneyimi kapı açıldığında başlar. Dolaşım, görüş hattı ve ilk erişilen yüzeyler; aracın olduğundan daha kalabalık ya da daha ferah hissedilmesini belirler.",
    loungeEyebrow: "Ortak alan",
    transformEyebrow: "Gündüzden geceye",
    kitchenEyebrow: "Mutfak ve geçiş",
    privateEyebrow: "Kişisel alan",
    storageEyebrow: "Günlük düzen",
    closingEyebrow: "Bir sonraki katman",
    closingTitle: "Yaşam alanını, onu mümkün kılan sistemle birlikte okuyun.",
    closingBody:
      "Keşfet bölümü görünen deneyimi anlatır. Mühendislik ve Atölye ise bu alanın araç, enerji, su, ağırlık ve servis kararlarıyla nasıl doğrulandığını gösterir.",
    engineeringCta: "Mühendislik yaklaşımı",
    workshopCta: "Atölyeyi tanıyın",
    concept: "Skyvan konsept çalışması",
    scene: "Sahne",
  },
  en: {
    heroKicker: "Skyvan caravan experience",
    heroMeta: "FROM OUTSIDE TO INSIDE",
    heroFoot: "Living · transformation · personal space",
    arrivalEyebrow: "First encounter",
    arrivalTitle: "Exterior volume becomes interior flow.",
    arrivalBody:
      "The caravan experience starts when the door opens. Circulation, sightlines and the first surfaces you reach determine whether the vehicle feels crowded or calm.",
    loungeEyebrow: "Shared space",
    transformEyebrow: "From day into night",
    kitchenEyebrow: "Galley and circulation",
    privateEyebrow: "Personal space",
    storageEyebrow: "Daily order",
    closingEyebrow: "The next layer",
    closingTitle: "Read the living space together with the system that makes it possible.",
    closingBody:
      "Explore tells the visible story. Engineering and Workshop show how that space is validated against the vehicle, energy, water, mass and service decisions.",
    engineeringCta: "Engineering approach",
    workshopCta: "Explore Workshop",
    concept: "Skyvan concept study",
    scene: "Scene",
  },
} as const;

function ConceptCaption({
  locale,
  index,
}: {
  locale: ExploreLocale;
  index: string;
}) {
  const ui = exploreUi[locale];

  return (
    <figcaption className={styles.conceptCaption}>
      <span>{ui.concept}</span>
      <span>{index} / {ui.scene}</span>
    </figcaption>
  );
}

export function PublicExplorePage({
  page,
}: {
  page: PublicPageContent;
}): React.JSX.Element {
  const locale = page.locale;
  const ui = exploreUi[locale];
  const copy = publicEditorialContent[locale]["karavan-deneyimi"];
  const launchCopy = publicLaunchContent[locale];
  const [living, sleep, kitchen, personalSpace, storage] = copy.sections;
  const title = page.editorialPage?.title || copy.heading;
  const introduction = page.editorialPage?.introduction || copy.body;

  return (
    <main className={styles.explore}>
      <section className={styles.hero} aria-labelledby="explore-title">
        <div className={styles.heroMedia} aria-hidden="true">
          <PublicConceptMedia
            name="exterior-landscape"
            alt=""
            sizes="100vw"
            priority
          />
        </div>

        <div className={`sv-container ${styles.heroFrame}`}>
          <div className={styles.heroCopy}>
            <div className={styles.heroTopline}>
              <span>{ui.heroKicker}</span>
              <span>01 / 06</span>
            </div>
            <p className="sv-eyebrow">{ui.heroMeta}</p>
            <h1 id="explore-title">{title}</h1>
            <p>{introduction}</p>
          </div>

          <div className={styles.heroFoot}>
            <span>{ui.heroFoot}</span>
            <span>{ui.concept}</span>
          </div>
        </div>
      </section>

      <PublicMotion className={styles.story}>
        <section
          className={`sv-container ${styles.arrival}`}
          data-sv-reveal
          aria-labelledby="explore-arrival-title"
        >
          <figure className={styles.arrivalMedia}>
            <PublicConceptMedia
              name="interior-first-view"
              alt={
                locale === "tr"
                  ? "Skyvan yaşam alanına giriş, oturum ve mutfak ilişkisini gösteren konsept."
                  : "Skyvan interior-entry concept showing the relationship between lounge and galley."
              }
              sizes="(max-width: 767px) 100vw, 58vw"
            />
            <ConceptCaption locale={locale} index="02" />
          </figure>

          <div className={styles.arrivalCopy}>
            <span className={styles.number}>02</span>
            <p className="sv-eyebrow">{ui.arrivalEyebrow}</p>
            <h2 id="explore-arrival-title">{ui.arrivalTitle}</h2>
            <p>{ui.arrivalBody}</p>
          </div>
        </section>

        <section
          className={`sv-container ${styles.lounge}`}
          data-sv-reveal
          aria-labelledby="explore-living-title"
        >
          <div className={styles.loungeCopy}>
            <span className={styles.number}>03</span>
            <p className="sv-eyebrow">{ui.loungeEyebrow}</p>
            <h2 id="explore-living-title">{living.heading}</h2>
            <p>{living.body}</p>
          </div>

          <figure className={styles.loungeMedia}>
            <PublicConceptMedia
              name="lounge-table"
              alt={
                locale === "tr"
                  ? "Skyvan U oturum, masa ve ortak yaşam alanı konsepti."
                  : "Skyvan U-lounge, table and shared living-space concept."
              }
              sizes="(max-width: 767px) 100vw, 58vw"
            />
            <ConceptCaption locale={locale} index="03" />
          </figure>
        </section>

        <section
          className={styles.transform}
          data-sv-reveal
          aria-labelledby="explore-transform-title"
        >
          <div className={`sv-container ${styles.transformHeading}`}>
            <div>
              <span className={styles.number}>04</span>
              <p className="sv-eyebrow">{ui.transformEyebrow}</p>
              <h2 id="explore-transform-title">{sleep.heading}</h2>
            </div>
            <p>{sleep.body}</p>
          </div>

          <div className={`sv-container ${styles.galleryFrame}`}>
            <PublicLivingGallery
              copy={launchCopy.product}
              concept={launchCopy.concept}
              locale={locale}
              editorial
            />
          </div>
        </section>

        <section
          className={`sv-container ${styles.kitchen}`}
          data-sv-reveal
          aria-labelledby="explore-kitchen-title"
        >
          <figure className={styles.kitchenMedia}>
            <PublicConceptMedia
              name="kitchen-transition"
              alt={
                locale === "tr"
                  ? "Skyvan mutfak, dolaşım ve oturma alanı konsepti."
                  : "Skyvan galley, circulation and lounge concept."
              }
              sizes="(max-width: 767px) 100vw, 52vw"
            />
            <ConceptCaption locale={locale} index="05" />
          </figure>

          <div className={styles.kitchenCopy}>
            <span className={styles.number}>05</span>
            <p className="sv-eyebrow">{ui.kitchenEyebrow}</p>
            <h2 id="explore-kitchen-title">{kitchen.heading}</h2>
            <p>{kitchen.body}</p>
          </div>
        </section>

        <section
          className={styles.private}
          data-sv-reveal
          aria-labelledby="explore-private-title"
        >
          <div className={`sv-container ${styles.privateFrame}`}>
            <div className={styles.privateCopy}>
              <span className={styles.number}>06</span>
              <p className="sv-eyebrow">{ui.privateEyebrow}</p>
              <h2 id="explore-private-title">{personalSpace.heading}</h2>
              <p>{personalSpace.body}</p>
            </div>

            <div className={styles.privateMedia}>
              <PublicLivingConceptStudies
                copy={launchCopy.product}
                locale={locale}
                images={["toilet", "shower"]}
              />
            </div>
          </div>
        </section>

        <section
          className={`sv-container ${styles.storage}`}
          data-sv-reveal
          aria-labelledby="explore-storage-title"
        >
          <span className={styles.storageIndex}>07</span>
          <div>
            <p className="sv-eyebrow">{ui.storageEyebrow}</p>
            <h2 id="explore-storage-title">{storage.heading}</h2>
          </div>
          <p>{storage.body}</p>
        </section>
      </PublicMotion>

      <section className={styles.closing} aria-labelledby="explore-next-title">
        <div className={`sv-container ${styles.closingFrame}`}>
          <div>
            <p className="sv-eyebrow">{ui.closingEyebrow}</p>
            <h2 id="explore-next-title">{ui.closingTitle}</h2>
          </div>
          <div>
            <p>{ui.closingBody}</p>
            <div className={styles.closingActions}>
              <Link
                className="sv-text-link"
                href={getLocalizedPath(locale, "muhendislik")}
              >
                {ui.engineeringCta}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <Link
                className="sv-text-link"
                href={getLocalizedPath(locale, "workshop")}
              >
                {ui.workshopCta}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
