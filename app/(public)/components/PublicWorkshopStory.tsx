import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Database, FileCheck2, ShieldCheck } from "lucide-react";
import type { JSX, ReactNode } from "react";

import type { PublicPageContent } from "../lib/launch-content";
import {
  type EditorialSection,
  type PublicEditorialCopy,
} from "../lib/public-editorial-content";
import { getLocalizedPath } from "../lib/public-routing";
import { PublicMotion } from "./PublicMotion";
import { PublicProjectAction } from "./PublicProjectAction";

type WorkshopStoryProps = {
  page: PublicPageContent;
  copy: PublicEditorialCopy;
  children?: ReactNode;
};

type WorkshopLocale = PublicPageContent["locale"];

const workshopUi = {
  tr: {
    concept: "Planlanan deneyim · canlı yapılandırıcı değil",
    heroMarker: "SKYVAN / ATÖLYE",
    heroIndex: "01—04",
    heroTitle: "Araçtan onaya, bütün kararlar aynı bağlamda.",
    heroNote: "Atölye; araç, yaşam biçimi, gerçek ürün verisi ve teknik doğrulamayı aynı proje içinde bir araya getirecek.",
    flowLabel: "Atölye nasıl çalışır?",
    flowHeading: "Bir seçim, onu etkileyen diğer kararlarla birlikte okunur.",
    flowIntro: "Atölye müşteriyi ürün listeleri arasında yalnız bırakmaz. Önce bağlamı kurar, sonra görünür yerleşimi ve teknik sınırları birlikte açıklar.",
    contextLabel: "01 / Proje bağlamı",
    contextHeading: "Önce aracı ve hayatı tanımlarız.",
    contextIntro: "Aynı ürün her araçta ve her kullanım biçiminde aynı sonucu vermez. Bu yüzden ilk ekran teknik ürün seçmekten önce doğru bağlamı kurar.",
    vehicleLabel: "Araç bağlamı",
    vehicleRows: ["Gövde tipi", "Marka · model · varyant", "Kullanılabilir ölçüler", "Açıklıklar ve servis payı"],
    lifeLabel: "Yaşam brief’i",
    lifeRows: ["Rota ve seyahat süresi", "Birlikte yaşayan kişiler", "Oturum · uyku · mutfak", "Banyo · depolama · çalışma"],
    evidenceLabel: "02 / Ürün kanıtı",
    evidenceHeading: "Ürün seçimi, datasheet ile anlam kazanır.",
    evidenceNote: "Atölyede bir ürün yalnızca adı ve fiyatıyla görünmez. Ürün kaydı, teknik değerleri, üretici belgesi ve uyumluluk durumu birlikte okunur.",
    evidenceTopline: "PRODUCT EVIDENCE",
    evidenceTitle: "Gerçek ürün kaydı",
    evidenceSource: "Onaylı kaynak",
    evidenceFields: ["Teknik değerler", "Datasheet / kullanım kılavuzu", "Ağırlık ve güç", "Uyumluluk kuralları"],
    evidenceFooter: "Eksik veri sonuç gibi gösterilmez.",
    layerLabel: "03 / İki ayrı okuma",
    layerHeading: "Görsel yaşam alanı ile teknik sistem aynı şey değildir.",
    layerVisible: "Görünür yaşam",
    layerVisibleBody: "2.5D önizlemede müşterinin günlük hayatta göreceği yüzeyler ve yerleşim okunur.",
    layerVisibleItems: ["Mobilya ve malzeme", "Pencere, kapı ve dolaşım", "Oturum, yatak, masa ve banyo"],
    layerTechnical: "Teknik doğrulama",
    layerTechnicalBody: "Enerji, su, ağırlık ve servis kararları ayrı bir teknik özet içinde kontrol edilir.",
    layerTechnicalItems: ["MPPT · inverter · akü", "Kablo · sigorta · bağlantı", "Depo · pompa · manifold"],
    layerSeam: "ayrı katman",
    validationLabel: "04 / Doğrulama ve onay",
    validationHeading: "Sistem önerir; karar doğrulanır.",
    validationIntro: "Datasheet, araç ölçüsü, fiziksel yerleşim, enerji, su ve ağırlık ilişkisi birlikte değerlendirilir. Yapay zekâ açıklama yapar; doğrulanmış kurallar kesin uyumsuzluğu ayırır.",
    validationOpen: "Kontrol edilir",
    validationRows: ["Araç ve kullanılabilir ölçüler", "Gerçek ürün datasheet’i", "Fiziksel yerleşim ve servis payı", "Enerji, su ve ağırlık ilişkisi"],
    reviewLabel: "İnsan incelemesi",
    reviewNote: "Eksik bilgi varsa hangi ölçünün veya belgenin gerektiği görünür kalır. Nihai teknik ve ticari karar insan onayıyla verilir.",
    finalLabel: "Atölye / sıradaki adım",
    finalHeading: "Projenizi anlamlı kararlarla kurun.",
    finalBody: "Atölye açıldığında araç, yaşam düzeni ve teknik gereklilikler tek bir proje özeti içinde birlikte okunacak.",
    finalLink: "Mühendislik yaklaşımı",
  },
  en: {
    concept: "Planned experience · not a live configurator",
    heroMarker: "SKYVAN / WORKSHOP",
    heroIndex: "01—04",
    heroTitle: "From vehicle to approval, every decision shares one context.",
    heroNote: "Workshop will bring the vehicle, the way you live, real product data and technical validation into one project.",
    flowLabel: "How Workshop works",
    flowHeading: "A choice is read with the decisions it affects.",
    flowIntro: "Workshop will not leave customers alone with a list of products. It will establish the context first, then explain the visible layout and technical boundaries together.",
    contextLabel: "01 / Project context",
    contextHeading: "We define the vehicle and the life inside it first.",
    contextIntro: "The same product does not create the same result in every vehicle or use case. The first step is therefore context, not equipment.",
    vehicleLabel: "Vehicle context",
    vehicleRows: ["Body type", "Make · model · variant", "Usable dimensions", "Openings and service clearance"],
    lifeLabel: "Living brief",
    lifeRows: ["Route and duration", "People sharing the space", "Lounge · sleep · galley", "Bathroom · storage · work"],
    evidenceLabel: "02 / Product evidence",
    evidenceHeading: "A product choice becomes meaningful through its datasheet.",
    evidenceNote: "In Workshop, a product will not be shown only by name and price. The product record, technical values, manufacturer document and compatibility status will be read together.",
    evidenceTopline: "PRODUCT EVIDENCE",
    evidenceTitle: "Verified product record",
    evidenceSource: "Approved source",
    evidenceFields: ["Technical values", "Datasheet / manual", "Mass and power", "Compatibility rules"],
    evidenceFooter: "Missing data is never presented as a result.",
    layerLabel: "03 / Two ways of reading",
    layerHeading: "The visible living space is not the technical system.",
    layerVisible: "Visible living",
    layerVisibleBody: "The 2.5D preview will show the surfaces and layout that customers encounter in daily use.",
    layerVisibleItems: ["Furniture and materials", "Windows, doors and circulation", "Lounge, bed, table and bathroom"],
    layerTechnical: "Technical validation",
    layerTechnicalBody: "Energy, water, mass and service decisions will be checked in a separate technical summary.",
    layerTechnicalItems: ["MPPT · inverter · battery", "Cable · fuse · connection", "Tank · pump · manifold"],
    layerSeam: "separate layer",
    validationLabel: "04 / Validation and approval",
    validationHeading: "The system suggests; the project is verified.",
    validationIntro: "Datasheets, vehicle dimensions, physical placement, energy, water and mass relationships are reviewed together. AI explains; validated rules separate confirmed incompatibilities.",
    validationOpen: "Reviewed",
    validationRows: ["Vehicle and usable dimensions", "A real product datasheet", "Physical placement and service clearance", "Energy, water and mass relationships"],
    reviewLabel: "Human review",
    reviewNote: "When information is missing, the required measurement or document stays visible. Final technical and commercial decisions require human approval.",
    finalLabel: "Workshop / next step",
    finalHeading: "Build the project from meaningful decisions.",
    finalBody: "When Workshop opens, the vehicle, living arrangement and technical requirements will be read together in one project summary.",
    finalLink: "Engineering approach",
  },
} as const;

function getSection(copy: PublicEditorialCopy, id: string): EditorialSection {
  return copy.sections.find((section) => section.id === id) ?? {
    id,
    heading: "",
    body: "",
  };
}

function getFlowStages(copy: PublicEditorialCopy, locale: WorkshopLocale) {
  const source = copy.decisionArchitecture?.stages ?? [];
  const defaults = locale === "tr"
    ? [
        { title: "Bağlamı kur", body: "Araç, varyant ve kullanım çerçevesi." },
        { title: "Yaşamı tarifle", body: "Oturum, uyku, mutfak, banyo ve depolama." },
        { title: "Tekniği doğrula", body: "Ürün verisi, fiziksel yerleşim ve uyumluluk." },
        { title: "İncelemeye hazırla", body: "Uyarılar, açık sorular ve insan onayı." },
      ]
    : [
        { title: "Set the context", body: "Vehicle, variant and intended use." },
        { title: "Describe the life", body: "Lounge, sleep, galley, bathroom and storage." },
        { title: "Validate the technical", body: "Product data, physical fit and compatibility." },
        { title: "Prepare for review", body: "Warnings, open questions and human approval." },
      ];

  return defaults.map((fallback, index) => ({
    title: source[index]?.title ?? fallback.title,
    body: source[index]?.body ?? fallback.body,
  }));
}

function WorkshopHeroPanel({ locale, stages }: { locale: WorkshopLocale; stages: Array<{ title: string; body: string }> }): JSX.Element {
  const ui = workshopUi[locale];

  return (
    <figure className="sv-workshop-hero-panel" data-sv-reveal>
      <div className="sv-workshop-panel-topline"><span>{ui.heroMarker}</span><span>{ui.heroIndex}</span></div>
      <div className="sv-workshop-panel-intro">
        <span>{locale === "tr" ? "ATÖLYE AKIŞI" : "WORKSHOP FLOW"}</span>
        <strong>{ui.heroTitle}</strong>
      </div>
      <ol className="sv-workshop-panel-stages">
        {stages.map((stage, index) => (
          <li key={stage.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{stage.title}</strong><small>{stage.body}</small></div>
          </li>
        ))}
      </ol>
      <div className="sv-workshop-panel-footer"><span>{ui.concept}</span><span>SKYVAN / 2026</span></div>
      <figcaption>{ui.concept}</figcaption>
    </figure>
  );
}

function WorkshopContextCards({ locale, vehicle, project }: { locale: WorkshopLocale; vehicle: EditorialSection; project: EditorialSection }): JSX.Element {
  const ui = workshopUi[locale];
  const cards = [
    { label: ui.vehicleLabel, heading: vehicle.heading, body: vehicle.body, rows: ui.vehicleRows },
    { label: ui.lifeLabel, heading: project.heading, body: project.body, rows: ui.lifeRows },
  ];

  return (
    <div className="sv-workshop-context-cards" data-sv-reveal>
      {cards.map((card, index) => (
        <article className="sv-workshop-context-card" key={card.label}>
          <div className="sv-workshop-card-topline"><span>0{index + 1}</span><span>{card.label}</span></div>
          <h3>{card.heading}</h3>
          <p>{card.body}</p>
          <ul>
            {card.rows.map((row) => <li key={row}><span aria-hidden="true" />{row}</li>)}
          </ul>
        </article>
      ))}
    </div>
  );
}

function WorkshopEvidenceVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];

  return (
    <div className="sv-workshop-evidence" data-sv-reveal role="img" aria-label={locale === "tr" ? "Atölyede ürün datasheet ve uyumluluk bilgisinin nasıl gösterileceğini anlatan örnek panel" : "Example panel showing how Workshop will present product datasheet and compatibility information"}>
      <div className="sv-workshop-card-topline"><span>{ui.evidenceTopline}</span><span>{locale === "tr" ? "ÖRNEK KAYIT" : "CONCEPT RECORD"}</span></div>
      <div className="sv-workshop-evidence-heading">
        <div><span className="sv-workshop-evidence-icon"><Database size={16} aria-hidden="true" /></span><div><small>{locale === "tr" ? "ÜRÜN KAYDI" : "PRODUCT RECORD"}</small><strong>{ui.evidenceTitle}</strong></div></div>
        <span className="sv-workshop-evidence-status"><FileCheck2 size={13} aria-hidden="true" />{ui.evidenceSource}</span>
      </div>
      <div className="sv-workshop-evidence-fields">
        {ui.evidenceFields.map((field, index) => (
          <div key={field}><span>0{index + 1}</span><strong>{field}</strong><small>{locale === "tr" ? "kayda bağlanır" : "linked to the record"}</small></div>
        ))}
      </div>
      <div className="sv-workshop-evidence-footer"><ShieldCheck size={14} aria-hidden="true" /><span>{ui.evidenceFooter}</span></div>
    </div>
  );
}

function WorkshopLayerVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  const columns = [
    { title: ui.layerVisible, body: ui.layerVisibleBody, items: ui.layerVisibleItems, tone: "visible" },
    { title: ui.layerTechnical, body: ui.layerTechnicalBody, items: ui.layerTechnicalItems, tone: "technical" },
  ];

  return (
    <div className="sv-workshop-layer-visual" data-sv-reveal>
      <div className="sv-workshop-card-topline"><span>{locale === "tr" ? "İKİ AYRI KATMAN" : "TWO SEPARATE LAYERS"}</span><span>2.5D / SYSTEMS</span></div>
      <div className="sv-workshop-layer-columns">
        {columns.map((column, index) => (
          <div className={`sv-workshop-layer-column sv-workshop-layer-column-${column.tone}`} key={column.title}>
            <span className="sv-workshop-layer-number">0{index + 1}</span>
            <h3>{column.title}</h3>
            <p>{column.body}</p>
            <ul>{column.items.map((item) => <li key={item}><Check size={13} aria-hidden="true" />{item}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="sv-workshop-layer-separator"><span>{ui.layerSeam}</span></div>
    </div>
  );
}

function WorkshopValidationVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];

  return (
    <div className="sv-workshop-validation-visual-clean" data-sv-reveal>
      <div className="sv-workshop-card-topline"><span>VALIDATION ORDER</span><span>DATA FIRST</span></div>
      <ol>
        {ui.validationRows.map((row, index) => (
          <li key={row}><span>{String(index + 1).padStart(2, "0")}</span><strong>{row}</strong><small>{ui.validationOpen}</small></li>
        ))}
      </ol>
    </div>
  );
}

function WorkshopReviewVisual({ locale, authority }: { locale: WorkshopLocale; authority: NonNullable<PublicEditorialCopy["decisionArchitecture"]>["authority"] }): JSX.Element {
  const ui = workshopUi[locale];
  const fallback = locale === "tr"
    ? [
        { title: "Yapay zekâ", body: "Açıklar, uyarır ve alternatif önerir." },
        { title: "Doğrulanmış kurallar", body: "Kesin uyumsuzluklarda ilerlemeyi engeller." },
        { title: "İnsan onayı", body: "Nihai teknik ve ticari kararı verir." },
      ]
    : [
        { title: "AI", body: "Explains, warns and suggests alternatives." },
        { title: "Validated rules", body: "Blocks confirmed incompatibilities." },
        { title: "Human approval", body: "Makes the final technical and commercial decision." },
      ];
  const items = authority.length > 0 ? authority : fallback;

  return (
    <div className="sv-workshop-review-visual" data-sv-reveal>
      <div className="sv-workshop-card-topline"><span>{ui.reviewLabel}</span><span>FINAL SCOPE</span></div>
      <div className="sv-workshop-review-grid">
        {items.slice(0, 3).map((item, index) => (
          <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p></article>
        ))}
      </div>
      <p className="sv-workshop-review-note">{ui.reviewNote}</p>
    </div>
  );
}

export function PublicWorkshopStory({ page, copy, children }: WorkshopStoryProps): JSX.Element {
  const locale = page.locale;
  const ui = workshopUi[locale];
  const architecture = copy.decisionArchitecture;
  const stages = getFlowStages(copy, locale);
  const authority = architecture?.authority ?? [];
  const vehicle = getSection(copy, "vehicle-selection");
  const project = getSection(copy, "project-foundation");
  const category = getSection(copy, "category-choices");
  const visible = getSection(copy, "visible-preview");
  const boundary = getSection(copy, "preview-boundary");
  const validation = getSection(copy, "technical-validation");
  const sealing = getSection(copy, "project-sealing");
  const progress = getSection(copy, "progress-visibility");

  return (
    <PublicMotion className="sv-workshop-story-motion">
      <main className="sv-workshop-story">
        <section className="sv-workshop-story-hero" aria-labelledby="workshop-story-title">
          <div className="sv-container sv-workshop-story-hero-grid">
            <div className="sv-workshop-story-hero-copy" data-sv-reveal>
              <div className="sv-workshop-story-kicker"><p className="sv-eyebrow">{copy.eyebrow}</p>{copy.status ? <span className="sv-status">{copy.status}</span> : null}</div>
              <h1 id="workshop-story-title">{copy.heading}</h1>
              <p>{copy.body}</p>
              <div className="sv-workshop-story-hero-note"><span>{ui.heroMarker}</span><p>{ui.heroNote}</p></div>
              <div className="sv-workshop-story-hero-link"><a className="sv-text-link" href="#workshop-flow">{ui.flowLabel}<ChevronRight size={17} aria-hidden="true" /></a></div>
            </div>
            <WorkshopHeroPanel locale={locale} stages={stages} />
          </div>
        </section>

        <section id="workshop-flow" className="sv-container sv-workshop-story-section sv-workshop-flow" aria-labelledby="workshop-flow-title">
          <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.flowLabel}</p><h2 id="workshop-flow-title">{ui.flowHeading}</h2></div><p>{ui.flowIntro}</p></div>
          <ol className="sv-workshop-flow-rail">
            {stages.map((stage, index) => <li key={stage.title} data-sv-reveal><span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.body}</p></li>)}
          </ol>
        </section>

        <section id="workshop-context" className="sv-container sv-workshop-story-section" aria-labelledby="workshop-context-title">
          <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.contextLabel}</p><h2 id="workshop-context-title">{ui.contextHeading}</h2></div><p>{ui.contextIntro}</p></div>
          <WorkshopContextCards locale={locale} vehicle={vehicle} project={project} />
        </section>

        <section id="product-evidence" className="sv-container sv-workshop-story-section sv-workshop-clean-dual" aria-labelledby="workshop-evidence-title">
          <div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.evidenceLabel}</p><h2 id="workshop-evidence-title">{ui.evidenceHeading}</h2><p>{category.body || ui.evidenceNote}</p>{category.bullets ? <ul className="sv-workshop-inline-points">{category.bullets.map((item) => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul> : null}</div>
          <WorkshopEvidenceVisual locale={locale} />
        </section>

        <section id="preview-boundary" className="sv-container sv-workshop-story-section sv-workshop-clean-dual sv-workshop-clean-dual-reverse" aria-labelledby="workshop-layer-title">
          <div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.layerLabel}</p><h2 id="workshop-layer-title">{ui.layerHeading}</h2><p>{visible.body}</p><p className="sv-workshop-boundary-copy">{boundary.body}</p></div>
          <WorkshopLayerVisual locale={locale} />
        </section>

        <section id="technical-validation" className="sv-container sv-workshop-story-section" aria-labelledby="workshop-validation-title">
          <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.validationLabel}</p><h2 id="workshop-validation-title">{ui.validationHeading}</h2></div><p>{validation.body || ui.validationIntro}</p></div>
          <div className="sv-workshop-validation-clean-grid"><WorkshopValidationVisual locale={locale} />{validation.bullets ? <ul className="sv-workshop-validation-list-clean" data-sv-reveal>{validation.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div>
        </section>

        <section id="project-review" className="sv-container sv-workshop-story-section" aria-labelledby="workshop-review-title">
          <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.reviewLabel}</p><h2 id="workshop-review-title">{sealing.heading}</h2></div><p>{sealing.body}</p></div>
          <WorkshopReviewVisual locale={locale} authority={authority} />
          <p className="sv-workshop-progress-note" data-sv-reveal>{progress.body}</p>
        </section>

        {children ? <aside className="sv-published-copy" aria-label={locale === "tr" ? "Yayınlanmış ek içerik" : "Additional published content"}>{children}</aside> : null}

        <section className="sv-workshop-story-final" aria-labelledby="workshop-final-title">
          <div className="sv-container sv-workshop-story-final-grid"><div><p className="sv-eyebrow">{ui.finalLabel}</p><h2 id="workshop-final-title">{ui.finalHeading}</h2><p>{ui.finalBody}</p>{copy.note ? <p className="sv-workshop-final-note">{copy.note}</p> : null}</div><div className="sv-workshop-story-actions"><PublicProjectAction locale={locale} secondary /><Link className="sv-text-link" href={getLocalizedPath(locale, "muhendislik")}>{ui.finalLink}<ArrowUpRight size={17} aria-hidden="true" /></Link></div></div>
        </section>
      </main>
    </PublicMotion>
  );
}
