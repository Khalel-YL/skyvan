import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Database,
  FileCheck2,
  ShieldCheck,
  SunMedium,
  TriangleAlert,
} from "lucide-react";
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
    concept: "Planlanan deneyim · gerçek veriyle çalışır",
    heroMarker: "SKYVAN / ATÖLYE",
    heroIndex: "01—04",
    heroTitle: "Bir ürün seçmezsiniz. Bir sistem kurarsınız.",
    heroNote:
      "Atölye; aracınızı, kullanım biçiminizi, gerçek ürün datasheet’lerini ve teknik sınırları aynı karar akışında buluşturur.",
    flowLabel: "Atölye nasıl çalışır?",
    flowHeading: "Seçim yaptıkça, etkisini de görürsünüz.",
    flowIntro:
      "Müşteri ürün kataloğunda kaybolmaz. Araçla başlar; enerji, su, malzeme, ağırlık ve kontrol kararlarını birbirine bağlayarak ilerler.",
    contextLabel: "01 / Proje bağlamı",
    contextHeading: "Önce araç ve yaşam biçimi tanımlanır.",
    contextIntro:
      "Aynı panel, depo veya mobilya her araçta aynı sonucu vermez. Ölçü, kullanım ve servis payı kurulmadan teknik seçim kesinleşmiş sayılmaz.",
    vehicleLabel: "Araç bağlamı",
    vehicleRows: [
      "Marka · model · varyant",
      "Kullanılabilir çatı ve iç ölçüler",
      "Açıklıklar, aks yükleri ve taşıma sınırı",
      "Bakım ve servis için ayrılan alan",
    ],
    lifeLabel: "Kullanım brief’i",
    lifeRows: [
      "Günlük enerji ve cihaz ihtiyacı",
      "Su kullanımı ve seyahat süresi",
      "Oturum · uyku · mutfak · banyo",
      "Manuel veya akıllı kontrol tercihi",
    ],
    selectionLabel: "02 / Seçim alanları",
    selectionHeading: "Atölye, bütün grubu ilişkileriyle gösterir.",
    selectionIntro:
      "Her kategori kendi içinde değil, diğer seçimlere etkisiyle okunur. Ürün adı, ağırlık, teknik değer, belge ve araç uygunluğu aynı kaydın parçalarıdır.",
    selectionGroups: [
      {
        title: "Enerji",
        body: "Panel türü, dizi bağlantısı, MPPT, akü, inverter, DC–DC ve koruma zinciri.",
        items: ["Mono · poli · half-cut", "Voc · Vmp · Isc · Imp", "Akü kimyası ve kapasitesi"],
      },
      {
        title: "Su",
        body: "Depo kapasitesi, pompa, filtre, süzgeç, manifold ve gri su dengesi.",
        items: ["Litre ve dolu kütle", "Pompa girişinde süzgeç", "Erişilebilir servis noktası"],
      },
      {
        title: "Malzeme ve kütle",
        body: "MDF, marin panel veya hafif panel kararının toplam kütleye ve dengeye etkisi.",
        items: ["Ürün datasheet ağırlığı", "Kesim ve sabitleme payı", "Aks yükü ve kütle merkezi"],
      },
      {
        title: "Kontrol ve servis",
        body: "Manuel tuşlu kullanım, akıllı otomasyon, izleme ve erişilebilir servis düzeni.",
        items: ["Kontrol arayüzü", "Etiketli bağlantılar", "İnsan onayı ve mühürleme"],
      },
    ],
    evidenceLabel: "03 / Datasheet kanıtı",
    evidenceHeading: "Her seçim, ölçülebilir bir kayda dayanır.",
    evidenceNote:
      "Atölye gerçek Admin ürün kayıtlarını okur. Datasheet veya teknik kaynak yoksa sonuç uydurmaz; verinin eksik olduğunu ve hangi belgenin gerektiğini gösterir.",
    evidenceTopline: "PRODUCT EVIDENCE",
    evidenceTitle: "Ürün kaydı + üretici kaynağı",
    evidenceSource: "Kaynağa bağlı",
    evidenceFields: [
      "Teknik değerler",
      "Datasheet / kullanım kılavuzu",
      "Ağırlık · güç · kapasite",
      "Araç ve ürün kuralları",
    ],
    evidenceFooter: "Eksik veri, uygunluk sonucu gibi gösterilmez.",
    calculationLabel: "04 / Örnek karar akışı",
    calculationHeading: "820 W, tek başına bir cevap değildir.",
    calculationIntro:
      "Aşağıdaki örnek canlı bir ürün teklifi değildir; Atölye’nin gerçek ürün verisiyle nasıl düşündüğünü gösterir.",
    calculationSteps: [
      { number: "01", label: "Panel seçimi", value: "4 × 205 W half-cut", detail: "Toplam nominal dizi: 820 W" },
      { number: "02", label: "Elektrik okuması", value: "Voc · Vmp · Isc · Imp", detail: "Seri / paralel bağlantı dizi sınırlarını değiştirir" },
      { number: "03", label: "Enerji tahmini", value: "W × güneş saati × verim", detail: "Örnek varsayım: 4 saat × %75 ≈ 2,46 kWh/gün" },
      { number: "04", label: "MPPT kapısı", value: "Akım + PV gerilimi + akü", detail: "30 A, bu örnek 12 V sistemde yeterli kabul edilmez; gerçek adaylar datasheet ile süzülür" },
    ],
    calculationFootnote:
      "Nominal watt, gerçek üretim garantisi değildir. Sistem gerilimi, sıcaklık, gölgelenme, kablo kaybı, akü kabulü ve üretici sınırları birlikte doğrulanır.",
    layerLabel: "05 / İki ayrı okuma",
    layerHeading: "Yaşam alanı görünür; teknik sistem açıklanır.",
    layerVisible: "Görsel yerleşim",
    layerVisibleBody:
      "2.5D önizleme müşterinin yaşayacağı yüzeyleri ve dolaşımı gösterir; teknik bileşenleri dekoratif bir şema gibi üst üste bindirmez.",
    layerVisibleItems: ["Mobilya ve malzeme", "Pencere, kapı ve dolaşım", "Oturum, yatak, masa ve banyo"],
    layerTechnical: "Teknik karar özeti",
    layerTechnicalBody:
      "Enerji, su, ağırlık, kontrol ve servis kararları ayrı okunur; her değer ürün kaydı ve belgeyle ilişkilendirilir.",
    layerTechnicalItems: ["Panel · MPPT · akü · inverter", "Kablo · sigorta · bağlantı", "Depo · pompa · manifold"],
    layerSeam: "katmanlar karıştırılmaz",
    validationLabel: "06 / Uyum ve doğrulama",
    validationHeading: "Sistem önerir; kural motoru ve insan doğrular.",
    validationIntro:
      "Seçilen parçalar araç, fiziksel yerleşim, enerji, su, kütle ve servis koşullarıyla birlikte değerlendirilir. Yapay zekâ nedeni açıklar; doğrulanmış kurallar kesin uyumsuzlukları ayırır.",
    validationOpen: "Kontrol edilir",
    validationRows: [
      "Çatı alanı, ölçü ve açıklıklar",
      "Panel dizisi ve MPPT PV sınırları",
      "Akü, inverter, DC–DC ve kablo yolu",
      "Depo hacmi, pompa, süzgeç ve servis erişimi",
      "Toplam kütle, aks yükü ve insan onayı",
    ],
    reviewLabel: "Karar sorumluluğu",
    reviewNote:
      "AI açıklar, uyarır ve alternatif gösterir. Rule engine kesin uyumsuzluğu engeller. Nihai teknik ve ticari karar, eksik bilgiler tamamlandıktan sonra insan onayıyla mühürlenir.",
    finalLabel: "Atölye / sıradaki adım",
    finalHeading: "Kendi sisteminizi veriye dayanarak kurun.",
    finalBody:
      "Atölye açıldığında araç, ürün datasheet’leri, hesaplar, uyarılar ve karar geçmişi tek bir proje özeti içinde birlikte okunacak.",
    finalLink: "Mühendislik yaklaşımı",
  },
  en: {
    concept: "Planned experience · grounded in real data",
    heroMarker: "SKYVAN / WORKSHOP",
    heroIndex: "01—04",
    heroTitle: "You do not choose a product. You build a system.",
    heroNote:
      "Workshop brings the vehicle, your way of living, real product datasheets and technical boundaries into one decision flow.",
    flowLabel: "How Workshop works",
    flowHeading: "As you choose, you see what the choice affects.",
    flowIntro:
      "Customers do not get lost in a catalogue. They start with the vehicle, then connect energy, water, material, mass and control decisions.",
    contextLabel: "01 / Project context",
    contextHeading: "The vehicle and the way you live come first.",
    contextIntro:
      "The same panel, tank or furniture choice does not create the same result in every vehicle. A technical choice is not settled before dimensions, use and service clearance are known.",
    vehicleLabel: "Vehicle context",
    vehicleRows: ["Make · model · variant", "Usable roof and interior dimensions", "Openings, axle loads and payload limit", "Space reserved for service"],
    lifeLabel: "Use brief",
    lifeRows: ["Daily energy and appliance demand", "Water use and trip duration", "Lounge · sleep · galley · bathroom", "Manual or smart control preference"],
    selectionLabel: "02 / Selection areas",
    selectionHeading: "Workshop shows the complete group through relationships.",
    selectionIntro:
      "Each category is read through its effect on the others. Product name, mass, technical values, documents and vehicle fit are one record.",
    selectionGroups: [
      { title: "Energy", body: "Panel type, array wiring, MPPT, battery, inverter, DC–DC and protection chain.", items: ["Mono · poly · half-cut", "Voc · Vmp · Isc · Imp", "Battery chemistry and capacity"] },
      { title: "Water", body: "Tank capacity, pump, filter, strainer, manifold and grey-water balance.", items: ["Litres and filled mass", "Strainer before the pump", "Reachable service point"] },
      { title: "Material and mass", body: "How MDF, marine board or lightweight panels change total mass and balance.", items: ["Datasheet mass", "Cutting and restraint allowance", "Axle load and centre of mass"] },
      { title: "Control and service", body: "Manual buttons, smart automation, monitoring and an accessible service layout.", items: ["Control interface", "Labelled connections", "Human review and sealing"] },
    ],
    evidenceLabel: "03 / Datasheet evidence",
    evidenceHeading: "Every choice starts from a measurable record.",
    evidenceNote:
      "Workshop reads real Admin product records. When a datasheet or technical source is missing, it does not invent an answer; it shows what is missing and which document is required.",
    evidenceTopline: "PRODUCT EVIDENCE",
    evidenceTitle: "Product record + manufacturer source",
    evidenceSource: "Source linked",
    evidenceFields: ["Technical values", "Datasheet / manual", "Mass · power · capacity", "Vehicle and product rules"],
    evidenceFooter: "Missing data is never presented as a compatibility result.",
    calculationLabel: "04 / Example decision flow",
    calculationHeading: "820 W is not an answer by itself.",
    calculationIntro: "This is not a live product quote; it shows how Workshop will reason from real product data.",
    calculationSteps: [
      { number: "01", label: "Panel choice", value: "4 × 205 W half-cut", detail: "Nominal array total: 820 W" },
      { number: "02", label: "Electrical reading", value: "Voc · Vmp · Isc · Imp", detail: "Series / parallel wiring changes the array limits" },
      { number: "03", label: "Energy estimate", value: "W × sun hours × efficiency", detail: "Illustration: 4 hours × 75% ≈ 2.46 kWh/day" },
      { number: "04", label: "MPPT gate", value: "Current + PV voltage + battery", detail: "30 A is not accepted for this 12 V example; candidates are filtered by datasheet" },
    ],
    calculationFootnote: "Nominal wattage is not a production guarantee. System voltage, temperature, shade, cable loss, battery acceptance and manufacturer limits are checked together.",
    layerLabel: "05 / Two ways of reading",
    layerHeading: "The living space is visible; the technical system is explained.",
    layerVisible: "Visible layout",
    layerVisibleBody: "The 2.5D preview shows the surfaces and circulation customers live with; it does not stack technical components into a decorative diagram.",
    layerVisibleItems: ["Furniture and material", "Windows, doors and circulation", "Lounge, bed, table and bathroom"],
    layerTechnical: "Technical decision summary",
    layerTechnicalBody: "Energy, water, mass, control and service decisions remain separate; every value is tied to a product record and source document.",
    layerTechnicalItems: ["Panel · MPPT · battery · inverter", "Cable · fuse · connection", "Tank · pump · manifold"],
    layerSeam: "layers stay separate",
    validationLabel: "06 / Fit and validation",
    validationHeading: "The system suggests; rules and people verify.",
    validationIntro: "Selected parts are reviewed against the vehicle, physical placement, energy, water, mass and service conditions. AI explains the reason; validated rules separate confirmed incompatibilities.",
    validationOpen: "Checked",
    validationRows: ["Roof area, dimensions and openings", "Panel array and MPPT PV limits", "Battery, inverter, DC–DC and cable path", "Tank volume, pump, strainer and service access", "Total mass, axle load and human approval"],
    reviewLabel: "Decision responsibility",
    reviewNote: "AI explains, warns and shows alternatives. The rule engine blocks confirmed incompatibilities. Final technical and commercial decisions are sealed by human approval after open information is resolved.",
    finalLabel: "Workshop / next step",
    finalHeading: "Build your system from evidence.",
    finalBody: "When Workshop opens, the vehicle, product datasheets, calculations, warnings and decision history will be read together in one project summary.",
    finalLink: "Engineering approach",
  },
} as const;

function getSection(copy: PublicEditorialCopy, id: string): EditorialSection {
  return copy.sections.find((section) => section.id === id) ?? { id, heading: "", body: "" };
}

function getFlowStages(copy: PublicEditorialCopy, locale: WorkshopLocale) {
  const source = copy.decisionArchitecture?.stages ?? [];
  const defaults = locale === "tr"
    ? [
        { title: "Bağlamı kur", body: "Araç, varyant ve kullanılabilir alan." },
        { title: "İhtiyacı tarifle", body: "Enerji, su, yaşam ve kontrol öncelikleri." },
        { title: "Ürünleri eşleştir", body: "Datasheet, ağırlık, ölçü ve teknik sınırlar." },
        { title: "Doğrula ve mühürle", body: "Uyarılar, açık sorular ve insan onayı." },
      ]
    : [
        { title: "Set the context", body: "Vehicle, variant and usable space." },
        { title: "Describe the need", body: "Energy, water, living and control priorities." },
        { title: "Match products", body: "Datasheet, mass, dimensions and limits." },
        { title: "Validate and seal", body: "Warnings, open questions and human approval." },
      ];
  return defaults.map((fallback, index) => ({ title: source[index]?.title ?? fallback.title, body: source[index]?.body ?? fallback.body }));
}

function WorkshopHeroPanel({ locale, stages }: { locale: WorkshopLocale; stages: Array<{ title: string; body: string }> }): JSX.Element {
  const ui = workshopUi[locale];
  return <figure className="sv-workshop-hero-panel" data-sv-reveal><div className="sv-workshop-panel-topline"><span>{ui.heroMarker}</span><span>{ui.heroIndex}</span></div><div className="sv-workshop-panel-intro"><span>{locale === "tr" ? "ATÖLYE KARAR AKIŞI" : "WORKSHOP DECISION FLOW"}</span><strong>{ui.heroTitle}</strong></div><ol className="sv-workshop-panel-stages">{stages.map((stage, index) => <li key={stage.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{stage.title}</strong><small>{stage.body}</small></div></li>)}</ol><div className="sv-workshop-panel-footer"><span>{ui.concept}</span><span>SKYVAN / 2026</span></div><figcaption>{ui.concept}</figcaption></figure>;
}

function WorkshopContextCards({ locale, vehicle, project }: { locale: WorkshopLocale; vehicle: EditorialSection; project: EditorialSection }): JSX.Element {
  const ui = workshopUi[locale];
  const cards = [{ label: ui.vehicleLabel, heading: vehicle.heading, body: vehicle.body, rows: ui.vehicleRows }, { label: ui.lifeLabel, heading: project.heading, body: project.body, rows: ui.lifeRows }];
  return <div className="sv-workshop-context-cards" data-sv-reveal>{cards.map((card, index) => <article className="sv-workshop-context-card" key={card.label}><div className="sv-workshop-card-topline"><span>0{index + 1}</span><span>{card.label}</span></div><h3>{card.heading}</h3><p>{card.body}</p><ul>{card.rows.map((row) => <li key={row}><span aria-hidden="true" />{row}</li>)}</ul></article>)}</div>;
}

function WorkshopSelectionVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-selection-visual" data-sv-reveal role="img" aria-label={locale === "tr" ? "Atölye enerji, su, malzeme ve kontrol seçimlerinin ilişkilerini gösteren panel" : "Panel showing the relationships between Workshop energy, water, material and control choices"}><div className="sv-workshop-card-topline"><span>WORKSHOP SYSTEM MAP</span><span>{locale === "tr" ? "SEÇİM GRUPLARI" : "DECISION GROUPS"}</span></div><div className="sv-workshop-selection-grid">{ui.selectionGroups.map((group) => <article key={group.title}><span className="sv-workshop-selection-icon"><span aria-hidden="true" /></span><div><h3>{group.title}</h3><p>{group.body}</p></div><ul>{group.items.map((item) => <li key={item}><Check size={12} aria-hidden="true" />{item}</li>)}</ul></article>)}</div></div>;
}

function WorkshopEvidenceVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-evidence" data-sv-reveal role="img" aria-label={locale === "tr" ? "Atölye ürün datasheet ve uyumluluk kaydı örneği" : "Example Workshop product datasheet and compatibility record"}><div className="sv-workshop-card-topline"><span>{ui.evidenceTopline}</span><span>{locale === "tr" ? "ÖRNEK KAYIT" : "CONCEPT RECORD"}</span></div><div className="sv-workshop-evidence-heading"><div><span className="sv-workshop-evidence-icon"><Database size={16} aria-hidden="true" /></span><div><small>{locale === "tr" ? "ÜRÜN KAYDI" : "PRODUCT RECORD"}</small><strong>{ui.evidenceTitle}</strong></div></div><span className="sv-workshop-evidence-status"><FileCheck2 size={13} aria-hidden="true" />{ui.evidenceSource}</span></div><div className="sv-workshop-evidence-fields">{ui.evidenceFields.map((field, index) => <div key={field}><span>0{index + 1}</span><strong>{field}</strong><small>{locale === "tr" ? "kayda bağlanır" : "linked to the record"}</small></div>)}</div><div className="sv-workshop-evidence-footer"><ShieldCheck size={14} aria-hidden="true" /><span>{ui.evidenceFooter}</span></div></div>;
}

function WorkshopCalculationVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-calculation-visual" data-sv-reveal><div className="sv-workshop-card-topline"><span>ILLUSTRATIVE LOGIC</span><span>{locale === "tr" ? "CANLI TEKLİF DEĞİL" : "NOT A LIVE QUOTE"}</span></div><div className="sv-workshop-calculation-head"><div><SunMedium size={18} aria-hidden="true" /><span>{locale === "tr" ? "Panel dizisi örneği" : "Panel array example"}</span></div><strong>4 × 205 W = 820 W</strong></div><ol className="sv-workshop-calculation-steps">{ui.calculationSteps.map((step) => <li key={step.number}><span>{step.number}</span><div><small>{step.label}</small><strong>{step.value}</strong><p>{step.detail}</p></div></li>)}</ol><div className="sv-workshop-calculation-footer"><TriangleAlert size={14} aria-hidden="true" /><span>{ui.calculationFootnote}</span></div></div>;
}

function WorkshopLayerVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  const columns = [{ title: ui.layerVisible, body: ui.layerVisibleBody, items: ui.layerVisibleItems, tone: "visible" }, { title: ui.layerTechnical, body: ui.layerTechnicalBody, items: ui.layerTechnicalItems, tone: "technical" }];
  return <div className="sv-workshop-layer-visual" data-sv-reveal><div className="sv-workshop-card-topline"><span>{locale === "tr" ? "İKİ AYRI KATMAN" : "TWO SEPARATE LAYERS"}</span><span>2.5D / SYSTEMS</span></div><div className="sv-workshop-layer-columns">{columns.map((column, index) => <div className={`sv-workshop-layer-column sv-workshop-layer-column-${column.tone}`} key={column.title}><span className="sv-workshop-layer-number">0{index + 1}</span><h3>{column.title}</h3><p>{column.body}</p><ul>{column.items.map((item) => <li key={item}><Check size={13} aria-hidden="true" />{item}</li>)}</ul></div>)}</div><div className="sv-workshop-layer-separator"><span>{ui.layerSeam}</span></div></div>;
}

function WorkshopValidationVisual({ locale }: { locale: WorkshopLocale }): JSX.Element {
  const ui = workshopUi[locale];
  return <div className="sv-workshop-validation-visual-clean" data-sv-reveal><div className="sv-workshop-card-topline"><span>VALIDATION ORDER</span><span>DATA FIRST</span></div><ol>{ui.validationRows.map((row, index) => <li key={row}><span>{String(index + 1).padStart(2, "0")}</span><strong>{row}</strong><small>{ui.validationOpen}</small></li>)}</ol></div>;
}

function WorkshopReviewVisual({ locale, authority }: { locale: WorkshopLocale; authority: NonNullable<PublicEditorialCopy["decisionArchitecture"]>["authority"] }): JSX.Element {
  const ui = workshopUi[locale];
  const fallback = locale === "tr" ? [{ title: "Yapay zekâ", body: "Açıklar, uyarır ve doğrulanmış alternatifleri gösterir." }, { title: "Rule engine", body: "Kesin uyumsuzluklarda ilerlemeyi engeller." }, { title: "İnsan onayı", body: "Nihai teknik ve ticari kararı mühürler." }] : [{ title: "AI", body: "Explains, warns and shows grounded alternatives." }, { title: "Rule engine", body: "Blocks confirmed incompatibilities." }, { title: "Human approval", body: "Seals the final technical and commercial decision." }];
  const items = authority.length > 0 ? authority : fallback;
  return <div className="sv-workshop-review-visual" data-sv-reveal><div className="sv-workshop-card-topline"><span>{ui.reviewLabel}</span><span>FINAL SCOPE</span></div><div className="sv-workshop-review-grid">{items.slice(0, 3).map((item, index) => <article key={item.title}><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div><p className="sv-workshop-review-note">{ui.reviewNote}</p></div>;
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

  return <PublicMotion className="sv-workshop-story-motion"><main className="sv-workshop-story">
    <section className="sv-workshop-story-hero" aria-labelledby="workshop-story-title"><div className="sv-container sv-workshop-story-hero-grid"><div className="sv-workshop-story-hero-copy" data-sv-reveal><div className="sv-workshop-story-kicker"><p className="sv-eyebrow">{copy.eyebrow}</p>{copy.status ? <span className="sv-status">{copy.status}</span> : null}</div><h1 id="workshop-story-title">{copy.heading}</h1><p>{copy.body}</p><div className="sv-workshop-story-hero-note"><span>{ui.heroMarker}</span><p>{ui.heroNote}</p></div><div className="sv-workshop-story-hero-link"><a className="sv-text-link" href="#workshop-flow">{ui.flowLabel}<ChevronRight size={17} aria-hidden="true" /></a></div></div><WorkshopHeroPanel locale={locale} stages={stages} /></div></section>
    <section id="workshop-flow" className="sv-container sv-workshop-story-section sv-workshop-flow" aria-labelledby="workshop-flow-title"><div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.flowLabel}</p><h2 id="workshop-flow-title">{ui.flowHeading}</h2></div><p>{ui.flowIntro}</p></div><ol className="sv-workshop-flow-rail">{stages.map((stage, index) => <li key={stage.title} data-sv-reveal><span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.body}</p></li>)}</ol></section>
    <section id="workshop-context" className="sv-container sv-workshop-story-section" aria-labelledby="workshop-context-title"><div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.contextLabel}</p><h2 id="workshop-context-title">{ui.contextHeading}</h2></div><p>{ui.contextIntro}</p></div><WorkshopContextCards locale={locale} vehicle={vehicle} project={project} /></section>
    <section id="product-evidence" className="sv-container sv-workshop-story-section sv-workshop-clean-dual" aria-labelledby="workshop-selection-title"><div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.selectionLabel}</p><h2 id="workshop-selection-title">{ui.selectionHeading}</h2><p>{ui.selectionIntro}</p>{category.bullets ? <ul className="sv-workshop-inline-points">{category.bullets.map((item) => <li key={item}><Check size={14} aria-hidden="true" />{item}</li>)}</ul> : null}</div><WorkshopSelectionVisual locale={locale} /></section>
    <section id="product-evidence-record" className="sv-container sv-workshop-story-section sv-workshop-clean-dual sv-workshop-clean-dual-reverse" aria-labelledby="workshop-evidence-title"><div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.evidenceLabel}</p><h2 id="workshop-evidence-title">{ui.evidenceHeading}</h2><p>{ui.evidenceNote}</p></div><WorkshopEvidenceVisual locale={locale} /></section>
    <section id="workshop-calculation" className="sv-container sv-workshop-story-section" aria-labelledby="workshop-calculation-title"><div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.calculationLabel}</p><h2 id="workshop-calculation-title">{ui.calculationHeading}</h2></div><p>{ui.calculationIntro}</p></div><WorkshopCalculationVisual locale={locale} /></section>
    <section id="preview-boundary" className="sv-container sv-workshop-story-section sv-workshop-clean-dual" aria-labelledby="workshop-layer-title"><div className="sv-workshop-story-copy" data-sv-reveal><p className="sv-eyebrow">{ui.layerLabel}</p><h2 id="workshop-layer-title">{ui.layerHeading}</h2><p>{visible.body}</p><p className="sv-workshop-boundary-copy">{boundary.body}</p></div><WorkshopLayerVisual locale={locale} /></section>
    <section id="technical-validation" className="sv-container sv-workshop-story-section" aria-labelledby="workshop-validation-title"><div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.validationLabel}</p><h2 id="workshop-validation-title">{ui.validationHeading}</h2></div><p>{validation.body || ui.validationIntro}</p></div><div className="sv-workshop-validation-clean-grid"><WorkshopValidationVisual locale={locale} />{validation.bullets ? <ul className="sv-workshop-validation-list-clean" data-sv-reveal>{validation.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div></section>
    <section id="project-review" className="sv-container sv-workshop-story-section" aria-labelledby="workshop-review-title"><div className="sv-workshop-story-heading" data-sv-reveal><div><p className="sv-eyebrow">{ui.reviewLabel}</p><h2 id="workshop-review-title">{sealing.heading}</h2></div><p>{sealing.body}</p></div><WorkshopReviewVisual locale={locale} authority={authority} /><p className="sv-workshop-progress-note" data-sv-reveal>{progress.body}</p></section>
    {children ? <aside className="sv-published-copy" aria-label={locale === "tr" ? "Yayınlanmış ek içerik" : "Additional published content"}>{children}</aside> : null}
    <section className="sv-workshop-story-final" aria-labelledby="workshop-final-title"><div className="sv-container sv-workshop-story-final-grid"><div><p className="sv-eyebrow">{ui.finalLabel}</p><h2 id="workshop-final-title">{ui.finalHeading}</h2><p>{ui.finalBody}</p>{copy.note ? <p className="sv-workshop-final-note">{copy.note}</p> : null}</div><div className="sv-workshop-story-actions"><PublicProjectAction locale={locale} secondary /><Link className="sv-text-link" href={getLocalizedPath(locale, "muhendislik")}>{ui.finalLink}<ArrowUpRight size={17} aria-hidden="true" /></Link></div></div></section>
  </main></PublicMotion>;
}
