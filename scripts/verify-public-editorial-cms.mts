import assert from "node:assert/strict";

import {
  getAboutEditorialCtaHref,
  getAboutEditorialCtaSlug,
  mergeAboutEditorialSections,
  normalizeAboutEditorialSectionCta,
  validateAboutEditorialContract,
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

console.log("12 editorial CMS contract assertions passed");
