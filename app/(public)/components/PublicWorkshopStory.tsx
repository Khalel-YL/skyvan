import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
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
    label: "Atölye / karar sistemi",
    concept: "Kavramsal akış · canlı configurator değil",
    heroMarker: "SKYVAN / WORKSHOP",
    heroIndex: "01—05",
    systemLabel: "Atölye mantığı",
    systemStatement: "Bir seçim, bağlı kararlarıyla birlikte okunur.",
    explore: "Akışı incele",
    flowLabel: "Tek bir seçim ekranı değil",
    flowIntro: "Atölye, müşterinin önce kendisi için doğru soruları kurmasına; sonra bu cevapları araç, yaşam alanı ve teknik doğrulama ile aynı bağlamda incelemesine yardım eder.",
    vehicleLabel: "01 / Araç bağlamı",
    vehicleMeta: "Başlangıç referansı",
    bodyType: "Gövde tipi",
    model: "Araç / varyant",
    dimensions: "Ölçü sınıfı",
    vehicleNote: "Her yerleşim, belirli bir araç bağlamında okunur. Eksik ölçü sonucu varsayılmaz.",
    briefLabel: "02 / Yaşam brief’i",
    briefMeta: "Kullanım öncelikleri",
    briefRows: ["Rota ve süre", "Birlikte yaşayan kişiler", "Günlük kullanım", "Öncelikli alan"],
    livingLabel: "03 / Görünür yaşam katmanı",
    livingMeta: "2.5D’de görünen yüzey",
    livingNote: "Yatak, oturum, mutfak, banyo, masa ve depolama; günlük kullanım akışı içinde birlikte düşünülür.",
    relationLabel: "04 / Karar ilişkileri",
    relationMeta: "Bir tercih tek başına kalmaz",
    relationCenter: "Bir karar",
    relationNodes: ["Yaşam alanı", "Enerji", "Su ve servis"],
    relationNote: "Bir malzeme, cihaz veya yerleşim değiştiğinde etkilenebilecek diğer başlıklar görünür tutulur.",
    boundaryLabel: "05 / Görünür ve teknik katman",
    boundaryMeta: "İki farklı okuma biçimi",
    visible: "Görünür yaşam",
    technical: "Teknik doğrulama",
    visibleItems: ["Mobilya ve malzeme yüzeyleri", "Pencere, kapı ve dolaşım", "Oturum, yatak ve masa"],
    technicalItems: ["MPPT · inverter · akü", "Kablo, sigorta ve bağlantı", "Depo, pompa ve manifold"],
    boundaryNote: "Teknik sistemler yaşam alanı görüntüsünde dekor gibi çizilmez; ayrı bir doğrulama katmanında açıklanır.",
    validationLabel: "06 / Doğrulama sırası",
    validationMeta: "Sonuçtan önce veri",
    validationOpen: "Veri gerekli",
    validationRows: ["Araç ve kullanılabilir ölçüler", "Gerçek ürün datasheet’i", "Fiziksel yerleşim ve servis payı", "Enerji, su ve ağırlık ilişkisi"],
    validationNote: "Atölye eksik bilgiyi sonuç gibi sunmaz. Uyarıların nedeni açıklanır; kesin teknik ve ticari karar insan onayında kalır.",
    authorityLabel: "Karar sorumluluğu",
    authorityIntro: "Atölye’nin amacı müşterinin kararları daha iyi anlamasını sağlamaktır; karar yetkilerini birbirine karıştırmaz.",
    guided: "Rehberli başlangıç",
    guidedBody: "Önceliklerini anlatan kullanıcı için sade sorular, ilişkili seçenekler ve açık kalan başlıklar.",
    pro: "Atölye Pro",
    proBody: "Teknik ekip ve deneyimli kullanıcı için daha ayrıntılı ürün, ölçü ve doğrulama bağlamı.",
    finalLabel: "Atölye / sıradaki adım",
    finalHeading: "Önce neye ihtiyacınız olduğunu anlayın.",
    finalBody: "Atölye açıldığında proje; araç, yaşam düzeni ve teknik gereklilikler birlikte okunarak hazırlanacak.",
    finalLink: "Mühendislik yaklaşımı",
  },
  en: {
    label: "Workshop / decision system",
    concept: "Conceptual flow · not a live configurator",
    heroMarker: "SKYVAN / WORKSHOP",
    heroIndex: "01—05",
    systemLabel: "Workshop logic",
    systemStatement: "A choice is read together with the decisions it affects.",
    explore: "Explore the flow",
    flowLabel: "More than a single selection screen",
    flowIntro: "Workshop is intended to help customers form the right questions first, then review their answers in the same context as the vehicle, living space and technical validation.",
    vehicleLabel: "01 / Vehicle context",
    vehicleMeta: "Starting reference",
    bodyType: "Body type",
    model: "Vehicle / variant",
    dimensions: "Dimension class",
    vehicleNote: "Every layout is read in a defined vehicle context. Missing dimensions do not become assumed results.",
    briefLabel: "02 / Living brief",
    briefMeta: "Use priorities",
    briefRows: ["Route and duration", "People sharing the space", "Daily routines", "Priority area"],
    livingLabel: "03 / Visible living layer",
    livingMeta: "The 2.5D surface",
    livingNote: "Bed, lounge, galley, bathroom, table and storage are considered together through everyday movement.",
    relationLabel: "04 / Decision relationships",
    relationMeta: "A preference never stands alone",
    relationCenter: "One decision",
    relationNodes: ["Living space", "Energy", "Water and service"],
    relationNote: "When a material, component or layout changes, the connected subjects remain visible for review.",
    boundaryLabel: "05 / Visible and technical layers",
    boundaryMeta: "Two ways of reading the project",
    visible: "Visible living",
    technical: "Technical validation",
    visibleItems: ["Furniture and material surfaces", "Windows, doors and circulation", "Lounge, bed and table"],
    technicalItems: ["MPPT · inverter · battery", "Cable, fuse and connection", "Tank, pump and manifold"],
    boundaryNote: "Technical systems are not drawn as decoration inside the living-space view; they are explained in a separate validation layer.",
    validationLabel: "06 / Validation order",
    validationMeta: "Data before result",
    validationOpen: "Data required",
    validationRows: ["Vehicle and usable dimensions", "A real product datasheet", "Physical placement and service clearance", "Energy, water and mass relationships"],
    validationNote: "Workshop will not present missing information as a result. Warnings are explained; final technical and commercial decisions remain with human approval.",
    authorityLabel: "Decision responsibility",
    authorityIntro: "Workshop is meant to help customers understand decisions better without confusing the roles that make them.",
    guided: "Guided start",
    guidedBody: "Simple questions, related choices and open subjects for customers beginning with their priorities.",
    pro: "Workshop Pro",
    proBody: "More detailed product, measurement and validation context for technical teams and experienced users.",
    finalLabel: "Workshop / next step",
    finalHeading: "Start by understanding what you need.",
    finalBody: "When Workshop opens, the project will be prepared by reading the vehicle, living arrangement and technical requirements together.",
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

function WorkshopHeroVisual({ locale, stages }: { locale: WorkshopLocale; stages: NonNullable<PublicEditorialCopy["decisionArchitecture"]>["stages"] }): JSX.Element {
  const ui = workshopUi[locale];
  return <figure className="sv-workshop-hero-visual" data-sv-reveal>
    <div className="sv-workshop-hero-board">
      <div className="sv-workshop-board-topline"><span>{ui.heroMarker}</span><span>{ui.heroIndex}</span></div>
      <div className="sv-workshop-board-intro">
        <span>{ui.systemLabel}</span>
        <strong>{ui.systemStatement}</strong>
      </div>
      <div className="sv-workshop-hero-route" aria-label={locale === "tr" ? "Atölye karar akışı" : "Workshop decision flow"}>
        <div className="sv-workshop-route-line" aria-hidden="true" />
        {stages.map((stage, index) => <div className="sv-workshop-route-stage" key={stage.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <b>{stage.title}</b>
          <small>{stage.body}</small>
        </div>)}
      </div>
      <div className="sv-workshop-board-footer"><span>{ui.concept}</span><span>SKYVAN / 2026</span></div>
    </div>
    <figcaption>{ui.concept}</figcaption>
  </figure>;
}

function WorkshopVehicleVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  const fields = [
    { label: ui.bodyType, value: locale === "tr" ? "Alkoven / panelvan" : "Overcab / panel van" },
    { label: ui.model, value: locale === "tr" ? "Marka · model · varyant" : "Make · model · variant" },
    { label: ui.dimensions, value: "L2 / L3 / L4 · H2 / H3" },
  ];
  return <div className="sv-workshop-vehicle-visual" role="img" aria-label={locale === "tr" ? "Araç bağlamı için kavramsal bilgi paneli" : "Concept information panel for vehicle context"}>
    <div className="sv-workshop-visual-topline"><span>{ui.vehicleMeta}</span><span>01 / 03</span></div>
    <div className="sv-workshop-vehicle-outline" aria-hidden="true">
      <span className="sv-workshop-vehicle-roof" />
      <span className="sv-workshop-vehicle-window" />
      <span className="sv-workshop-vehicle-cabin" />
      <span className="sv-workshop-vehicle-wheel sv-workshop-vehicle-wheel-front" />
      <span className="sv-workshop-vehicle-wheel sv-workshop-vehicle-wheel-rear" />
      <span className="sv-workshop-vehicle-baseline" />
    </div>
    <dl className="sv-workshop-vehicle-fields">
      {fields.map((field) => <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>)}
    </dl>
    <p className="sv-workshop-visual-note">{ui.vehicleNote}</p>
  </div>;
}

function WorkshopBriefVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-brief-visual" role="img" aria-label={locale === "tr" ? "Yaşam önceliklerinin proje brief'inde toplanması" : "Living priorities collected in the project brief"}>
    <div className="sv-workshop-visual-topline"><span>{ui.briefMeta}</span><span>02 / 03</span></div>
    <div className="sv-workshop-brief-mark" aria-hidden="true"><span>TRIP</span><span>LIVE</span><span>MAKE</span></div>
    <ol>
      {ui.briefRows.map((row, index) => <li key={row}><span>{String(index + 1).padStart(2, "0")}</span><b>{row}</b><i aria-hidden="true" /></li>)}
    </ol>
    <div className="sv-workshop-brief-footer"><span>{locale === "tr" ? "Öncelikler" : "Priorities"}</span><strong>{locale === "tr" ? "günlük kullanımdan çıkar" : "come from daily use"}</strong></div>
  </div>;
}

function WorkshopLivingVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  const zones = locale === "tr"
    ? ["Oturum", "Mutfak", "Uyku", "Banyo", "Depolama"]
    : ["Lounge", "Galley", "Sleep", "Bathroom", "Storage"];
  return <div className="sv-workshop-living-visual" role="img" aria-label={locale === "tr" ? "Görünür yaşam alanının kavramsal planı" : "Concept plan of the visible living space"}>
    <div className="sv-workshop-visual-topline"><span>{ui.livingMeta}</span><span>03 / 03</span></div>
    <div className="sv-workshop-plan-board">
      <div className="sv-workshop-plan-cab" aria-hidden="true"><span className="sv-workshop-plan-cab-window" /><span className="sv-workshop-plan-door" /></div>
      <div className="sv-workshop-plan-zone sv-workshop-plan-lounge"><span>01</span>{zones[0]}</div>
      <div className="sv-workshop-plan-zone sv-workshop-plan-galley"><span>02</span>{zones[1]}</div>
      <div className="sv-workshop-plan-zone sv-workshop-plan-sleep"><span>03</span>{zones[2]}</div>
      <div className="sv-workshop-plan-zone sv-workshop-plan-bath"><span>04</span>{zones[3]}</div>
      <div className="sv-workshop-plan-zone sv-workshop-plan-storage"><span>05</span>{zones[4]}</div>
      <div className="sv-workshop-plan-route" aria-hidden="true"><i /><i /><i /></div>
      <span className="sv-workshop-plan-axis" aria-hidden="true">{locale === "tr" ? "DOLAŞIM" : "CIRCULATION"}</span>
    </div>
    <p className="sv-workshop-visual-note">{ui.livingNote}</p>
  </div>;
}

function WorkshopRelationshipVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-relationship-visual" role="img" aria-label={locale === "tr" ? "Bir kararın yaşam, enerji ve su başlıklarıyla ilişkisi" : "Relationship between one decision, living, energy and water"}>
    <div className="sv-workshop-visual-topline"><span>{ui.relationMeta}</span><span>04 / 05</span></div>
    <div className="sv-workshop-relationship-map">
      <span className="sv-workshop-relationship-route sv-workshop-relationship-route-one" aria-hidden="true" />
      <span className="sv-workshop-relationship-route sv-workshop-relationship-route-two" aria-hidden="true" />
      <span className="sv-workshop-relationship-route sv-workshop-relationship-route-three" aria-hidden="true" />
      <div className="sv-workshop-relation-core"><span>01</span><strong>{ui.relationCenter}</strong><small>{locale === "tr" ? "etkisi incelenir" : "impact is reviewed"}</small></div>
      {ui.relationNodes.map((node, index) => <div className={`sv-workshop-relation-node sv-workshop-relation-node-${index + 1}`} key={node}><span>0{index + 2}</span><strong>{node}</strong><small>{locale === "tr" ? "bağlantılı başlık" : "connected subject"}</small></div>)}
    </div>
    <p className="sv-workshop-visual-note">{ui.relationNote}</p>
  </div>;
}

function WorkshopBoundaryVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-boundary-visual" role="img" aria-label={locale === "tr" ? "Görünür yaşam ve teknik doğrulama katmanlarının ayrımı" : "Separation between the visible living and technical validation layers"}>
    <div className="sv-workshop-visual-topline"><span>{ui.boundaryMeta}</span><span>05 / 05</span></div>
    <div className="sv-workshop-layer-board">
      <div className="sv-workshop-layer-card sv-workshop-layer-visible"><span className="sv-workshop-layer-kicker">01 / {ui.visible}</span><strong>{locale === "tr" ? "Yaşam alanı" : "Living space"}</strong><div className="sv-workshop-layer-lines"><i /><i /><i /></div><ul>{ui.visibleItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <div className="sv-workshop-layer-seam"><span aria-hidden="true">↕</span><b>{locale === "tr" ? "ayrı okuma" : "separate layer"}</b></div>
      <div className="sv-workshop-layer-card sv-workshop-layer-technical"><span className="sv-workshop-layer-kicker">02 / {ui.technical}</span><strong>{locale === "tr" ? "Sistem özeti" : "System summary"}</strong><ul>{ui.technicalItems.map((item) => <li key={item}><span aria-hidden="true" />{item}</li>)}</ul></div>
    </div>
    <p className="sv-workshop-visual-note">{ui.boundaryNote}</p>
  </div>;
}

function WorkshopValidationVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-validation-visual" role="img" aria-label={locale === "tr" ? "Atölye teknik doğrulama sırası" : "Workshop technical validation order"}>
    <div className="sv-workshop-visual-topline"><span>{ui.validationMeta}</span><span>CHECK / 04</span></div>
    <ol>
      {ui.validationRows.map((row, index) => <li key={row}><span className="sv-workshop-validation-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{row}</strong><small>{ui.validationOpen}</small></div><span className="sv-workshop-validation-mark" aria-hidden="true"><Check size={13} /></span></li>)}
    </ol>
    <p className="sv-workshop-visual-note">{ui.validationNote}</p>
  </div>;
}

function WorkshopAuthority({ locale, authority }: { locale: WorkshopLocale; authority: NonNullable<PublicEditorialCopy["decisionArchitecture"]>["authority"] }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-authority-story">
    <div className="sv-workshop-authority-heading"><p className="sv-eyebrow">{ui.authorityLabel}</p><p>{ui.authorityIntro}</p></div>
    <div className="sv-workshop-authority-grid">
      {authority.map((item, index) => <article key={item.title} data-sv-reveal><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}
    </div>
    <div className="sv-workshop-modes" data-sv-reveal>
      <article><span>01</span><h3>{ui.guided}</h3><p>{ui.guidedBody}</p></article>
      <article><span>02</span><h3>{ui.pro}</h3><p>{ui.proBody}</p></article>
    </div>
  </div>;
}

export function PublicWorkshopStory({ page, copy, children }: WorkshopStoryProps): JSX.Element {
  const locale = page.locale;
  const ui = workshopUi[locale];
  const architecture = copy.decisionArchitecture;
  const stages = architecture?.stages ?? [];
  const authority = architecture?.authority ?? [];
  const vehicle = getSection(copy, "vehicle-selection");
  const project = getSection(copy, "project-foundation");
  const category = getSection(copy, "category-choices");
  const visible = getSection(copy, "visible-preview");
  const boundary = getSection(copy, "preview-boundary");
  const validation = getSection(copy, "technical-validation");
  const sealing = getSection(copy, "project-sealing");
  const progress = getSection(copy, "progress-visibility");

  return <PublicMotion className="sv-workshop-story-motion"><main className="sv-workshop-story">
    <section className="sv-workshop-story-hero" aria-labelledby="workshop-story-title">
      <div className="sv-container sv-workshop-story-hero-grid">
        <div className="sv-workshop-story-hero-copy" data-sv-reveal>
          <div className="sv-workshop-story-kicker"><p className="sv-eyebrow">{copy.eyebrow}</p>{copy.status ? <span className="sv-status">{copy.status}</span> : null}</div>
          <h1 id="workshop-story-title">{copy.heading}</h1>
          <p>{copy.body}</p>
          <div className="sv-workshop-story-hero-link"><a className="sv-text-link" href="#workshop-flow">{ui.explore}<ChevronRight size={17} aria-hidden="true" /></a></div>
        </div>
        <WorkshopHeroVisual locale={locale} stages={stages} />
      </div>
    </section>

    <section id="workshop-flow" className="sv-container sv-workshop-story-section sv-workshop-flow" aria-labelledby="workshop-flow-title">
      <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.flowLabel}</p><h2 id="workshop-flow-title">{architecture?.heading ?? copy.heading}</h2></div><p>{ui.flowIntro}</p></div>
      <ol className="sv-workshop-flow-rail">
        {stages.map((stage, index) => <li key={stage.title} data-sv-reveal><span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.body}</p></li>)}
      </ol>
    </section>

    <section id="vehicle-selection" className="sv-container sv-workshop-story-section sv-workshop-dual" aria-labelledby="workshop-vehicle-title">
      <div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.vehicleLabel}</p><h2 id="workshop-vehicle-title">{vehicle.heading}</h2><p>{vehicle.body}</p></div>
      <WorkshopVehicleVisual locale={locale} />
    </section>

    <section id="project-foundation" className="sv-container sv-workshop-story-section sv-workshop-dual sv-workshop-dual-reverse" aria-labelledby="workshop-project-title">
      <div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.briefLabel}</p><h2 id="workshop-project-title">{project.heading}</h2><p>{project.body}</p></div>
      <WorkshopBriefVisual locale={locale} />
    </section>

    <section id="visible-preview" className="sv-container sv-workshop-story-section sv-workshop-dual" aria-labelledby="workshop-living-title">
      <div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.livingLabel}</p><h2 id="workshop-living-title">{visible.heading}</h2><p>{visible.body}</p><p className="sv-workshop-boundary-copy">{boundary.body}</p></div>
      <WorkshopLivingVisual locale={locale} />
    </section>

    <section id="category-choices" className="sv-container sv-workshop-story-section sv-workshop-relationship-section" aria-labelledby="workshop-relation-title">
      <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.relationLabel}</p><h2 id="workshop-relation-title">{category.heading}</h2></div><p>{category.body}</p></div>
      <div className="sv-workshop-relationship-layout"><WorkshopRelationshipVisual locale={locale} />{category.bullets ? <ul className="sv-workshop-category-list" data-sv-reveal>{category.bullets.map((item) => <li key={item}><span aria-hidden="true"><Check size={13} /></span>{item}</li>)}</ul> : null}</div>
    </section>

    <section id="preview-boundary" className="sv-container sv-workshop-story-section sv-workshop-dual sv-workshop-dual-reverse" aria-labelledby="workshop-boundary-title">
      <div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.boundaryLabel}</p><h2 id="workshop-boundary-title">{boundary.heading}</h2><p>{boundary.body}</p></div>
      <WorkshopBoundaryVisual locale={locale} />
    </section>

    <section id="technical-validation" className="sv-container sv-workshop-story-section sv-workshop-validation-section" aria-labelledby="workshop-validation-title">
      <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.validationLabel}</p><h2 id="workshop-validation-title">{validation.heading}</h2></div><p>{validation.body}</p></div>
      <div className="sv-workshop-validation-layout"><WorkshopValidationVisual locale={locale} />{validation.bullets ? <ul className="sv-workshop-validation-list" data-sv-reveal>{validation.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div>
    </section>

    <section id="project-sealing" className="sv-container sv-workshop-story-section sv-workshop-dual" aria-labelledby="workshop-sealing-title">
      <div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{locale === "tr" ? "07 / İncelemeye hazırlık" : "07 / Preparing for review"}</p><h2 id="workshop-sealing-title">{sealing.heading}</h2><p>{sealing.body}</p></div>
      <div className="sv-workshop-scope-visual" data-sv-reveal role="img" aria-label={locale === "tr" ? "Proje kapsamının inceleme için bir araya gelmesi" : "Project scope brought together for review"}>
        <div className="sv-workshop-visual-topline"><span>{locale === "tr" ? "ORTAK KAPSAM" : "SHARED SCOPE"}</span><span>REVIEW / 07</span></div>
        <div className="sv-workshop-scope-stack"><span>{locale === "tr" ? "Araç" : "Vehicle"}</span><span>{locale === "tr" ? "Yaşam" : "Living"}</span><span>{locale === "tr" ? "Enerji + su" : "Energy + water"}</span><span>{locale === "tr" ? "Açık sorular" : "Open questions"}</span></div>
        <div className="sv-workshop-scope-line" aria-hidden="true" />
        <p>{progress.body}</p>
      </div>
    </section>

    <section id="progress-visibility" className="sv-container sv-workshop-story-section sv-workshop-authority-section" aria-labelledby="workshop-authority-title">
      <div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.authorityLabel}</p><h2 id="workshop-authority-title">{progress.heading}</h2></div><p>{progress.body}</p></div>
      <WorkshopAuthority locale={locale} authority={authority} />
    </section>

    {children ? <aside className="sv-published-copy" aria-label={locale === "tr" ? "Yayınlanmış ek içerik" : "Additional published content"}>{children}</aside> : null}

    <section className="sv-workshop-story-final" aria-labelledby="workshop-final-title">
      <div className="sv-container sv-workshop-story-final-grid"><div><p className="sv-eyebrow">{ui.finalLabel}</p><h2 id="workshop-final-title">{ui.finalHeading}</h2><p>{ui.finalBody}</p>{copy.note ? <p className="sv-workshop-final-note">{copy.note}</p> : null}</div><div className="sv-workshop-story-actions"><PublicProjectAction locale={locale} secondary /><Link className="sv-text-link" href={getLocalizedPath(locale, "muhendislik")}>{ui.finalLink}<ArrowUpRight size={17} aria-hidden="true" /></Link></div></div>
    </section>
  </main></PublicMotion>;
}
