import assert from "node:assert/strict";

import {
  ABOUT_EDITORIAL_SECTION_IDS,
  getPublicEditorialCtaHref,
  getPublicEditorialCtaSlug,
  getPublicEditorialSectionIds,
  getAboutEditorialCtaHref,
  getAboutEditorialCtaSlug,
  mergeAboutEditorialSections,
  normalizeAboutEditorialSectionCta,
  normalizePublicSupplementaryBlockPresentation,
  validateAboutEditorialContract,
  validatePublicEditorialContract,
} from "../app/lib/public-editorial-cms.ts";

const editorial = {
  sectionId: "why-skyvan-exists",
  visible: true,
  visual: "inherit",
  layout: "text-only",
} as const;
const safeHref = getAboutEditorialCtaHref("tr", "muhendislik");

assert.equal(safeHref, "/tr/muhendislik");
assert.equal(getAboutEditorialCtaSlug("tr", safeHref), "muhendislik");
assert.equal(getAboutEditorialCtaSlug("en", safeHref), undefined);
assert.equal(getPublicEditorialCtaHref("en", "workshop"), "/en/workshop");
assert.equal(getPublicEditorialCtaSlug("tr", "/tr/muhendislik"), "muhendislik");
assert.equal(getPublicEditorialSectionIds("muhendislik").length, 8);
assert.deepEqual(normalizeAboutEditorialSectionCta("tr", "İncele", safeHref), {
  label: "İncele",
  href: safeHref,
});
assert.equal(
  normalizeAboutEditorialSectionCta("tr", "İncele", "https://example.com"),
  undefined,
);
assert.deepEqual(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", editorial, ctaLabel: "İncele", ctaHref: safeHref }],
  }),
  [],
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", editorial, ctaLabel: "İncele", ctaHref: "https://example.com" }],
  }).length > 0,
);
assert.deepEqual(
  validatePublicEditorialContract({
    locale: "tr",
    slug: "muhendislik",
    editorialPage: { title: "Teknik yaklaşım" },
    blocks: [
      { type: "text", editorial: { sectionId: "electrical-service", visible: true, visual: "inherit" } },
      { type: "text", editorial: { sectionId: "water-service", visible: true, visual: "inherit" } },
    ],
  }),
  [],
);
assert.ok(
  validatePublicEditorialContract({
    locale: "tr",
    slug: "workshop",
    editorialPage: undefined,
    blocks: [{ type: "text", editorial: { sectionId: "why-skyvan-exists", visible: true, visual: "inherit" } }],
  }).some((error) => error.includes("Bilinmeyen")),
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", editorial: { ...editorial, sectionId: "unknown-section" } }],
  }).some((error) => error.includes("Bilinmeyen")),
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [
      { type: "text", editorial },
      { type: "text", editorial },
    ],
  }).some((error) => error.includes("birden fazla")),
);
assert.ok(
  validateAboutEditorialContract({
    locale: "de",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", editorial }],
  }).some((error) => error.includes("yalnızca tr veya en")),
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", editorial, ctaLabel: "İncele" }],
  }).length > 0,
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", editorial, ctaLabel: 1, ctaHref: safeHref }],
  }).length > 0,
);

const fallback = [{ id: "why-skyvan-exists", heading: "Başlık", body: "Gövde" }];
assert.equal(
  mergeAboutEditorialSections(
    fallback,
    [{ editorial, ctaLabel: "İncele", ctaHref: safeHref }],
    "tr",
  )[0]?.cta?.href,
  safeHref,
);
assert.equal(
  mergeAboutEditorialSections(
    fallback,
    [{ editorial, ctaLabel: "İncele", ctaHref: "https://example.com" }],
    "tr",
  )[0]?.cta,
  undefined,
);
assert.equal(
  mergeAboutEditorialSections(
    fallback,
    [{ editorial: { ...editorial, visible: false } }],
    "tr",
  ).length,
  0,
);

const completeFallback = ABOUT_EDITORIAL_SECTION_IDS.map((id) => ({
  id,
  heading: `${id} başlık`,
  body: `${id} gövde`,
}));
const thinMerge = mergeAboutEditorialSections(
  completeFallback,
  [{ editorial: { ...editorial, sectionId: "why-skyvan-exists" }, heading: "Yeni başlık" }],
  "tr",
);
assert.equal(thinMerge.length, ABOUT_EDITORIAL_SECTION_IDS.length);
assert.equal(thinMerge[0]?.heading, "Yeni başlık");
assert.equal(thinMerge[1]?.id, "hands-on-build-experience");

const cms = {
  id: "supplemental-12345678",
  visible: true,
  layout: "surface",
} as const;
assert.deepEqual(normalizePublicSupplementaryBlockPresentation(cms), cms);
assert.deepEqual(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", heading: "Ek bölüm", body: "Ek içerik", cms }],
  }),
  [],
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [
      { type: "text", heading: "Bir", cms },
      { type: "stats", stats: [{ label: "A", value: "B" }], cms },
    ],
  }).some((error) => error.includes("birden fazla")),
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", heading: "Ek bölüm", cms: { ...cms, layout: "freeform" } }],
  }).some((error) => error.includes("sunumu desteklenmiyor")),
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "cta", heading: "Git", ctaLabel: "Dış bağlantı", ctaHref: "https://example.com", cms }],
  }).some((error) => error.includes("onaylı public rota")),
);
assert.ok(
  validateAboutEditorialContract({
    locale: "tr",
    slug: "hakkimizda",
    editorialPage: undefined,
    blocks: [{ type: "text", heading: "Medya", cms, media: { url: "https://example.com/media.jpg" } }],
  }).some((error) => error.includes("yönetilen medya")),
);

console.log("28 editorial CMS contract assertions passed");
