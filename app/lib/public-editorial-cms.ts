/**
 * Contract shared by the curated public pages and the Pages editor.
 *
 * Curated copy remains the safe fallback in code. The database only stores
 * validated, locale-specific overrides (text, order/visibility and layout),
 * so an incomplete admin record can never blank a public page.
 */
export const PUBLIC_EDITORIAL_SECTION_IDS = {
  hakkimizda: [
    "why-skyvan-exists",
    "hands-on-build-experience",
    "lightweight-material-decisions",
    "organized-service-access",
    "living-space-and-engineering",
    "open-technical-questions",
    "workshop-extension",
    "human-responsibility",
  ],
  "karavan-deneyimi": [
    "living",
    "sleep",
    "kitchen",
    "personal-space",
    "storage",
  ],
  muhendislik: [
    "vehicle-context",
    "material-weight-awareness",
    "layout-physical-fit",
    "roof-electrical-compatibility",
    "electrical-service",
    "water-service",
    "controls",
    "technical-review",
  ],
  workshop: [
    "vehicle-selection",
    "project-foundation",
    "category-choices",
    "visible-preview",
    "preview-boundary",
    "technical-validation",
    "project-sealing",
    "progress-visibility",
  ],
  "nasil-calisir": ["needs", "layout", "vehicle-review", "scope"],
  "uretim-sureci": [
    "defined-scope",
    "technical-definition",
    "approval-changes",
    "checks",
    "handover-preparation",
  ],
  sss: [],
  iletisim: ["prepare", "pending-channel", "current-status"],
  "proje-baslat": ["vehicle-question", "life-question", "technical-question"],
} as const;

export const PUBLIC_EDITORIAL_SLUGS = Object.keys(
  PUBLIC_EDITORIAL_SECTION_IDS,
) as Array<keyof typeof PUBLIC_EDITORIAL_SECTION_IDS>;

export const ABOUT_EDITORIAL_SLUG = "hakkimizda" as const;
export const ABOUT_EDITORIAL_SECTION_IDS =
  PUBLIC_EDITORIAL_SECTION_IDS.hakkimizda;

export const PUBLIC_EDITORIAL_CTA_SLUGS = PUBLIC_EDITORIAL_SLUGS.filter(
  (slug) => slug !== ABOUT_EDITORIAL_SLUG,
);
export const ABOUT_EDITORIAL_CTA_SLUGS = PUBLIC_EDITORIAL_CTA_SLUGS;

export const PUBLIC_SUPPLEMENTARY_BLOCK_TYPES = [
  "text",
  "feature-list",
  "stats",
  "cta",
] as const;

export const PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS = [
  "standard",
  "surface",
  "wide",
] as const;

export const MAX_PUBLIC_SUPPLEMENTARY_BLOCKS = 12;

export type PublicEditorialSlug = keyof typeof PUBLIC_EDITORIAL_SECTION_IDS;
export type PublicEditorialSectionId =
  (typeof PUBLIC_EDITORIAL_SECTION_IDS)[PublicEditorialSlug][number];
export type AboutEditorialSectionId =
  (typeof ABOUT_EDITORIAL_SECTION_IDS)[number];
export type AboutEditorialLocale = "tr" | "en";
export type AboutEditorialCtaSlug = (typeof ABOUT_EDITORIAL_CTA_SLUGS)[number];
export type PublicEditorialCtaSlug = (typeof PUBLIC_EDITORIAL_CTA_SLUGS)[number];
export type AboutEditorialLayout =
  | "text-only"
  | "media-left"
  | "media-right"
  | "wide-media";
export type AboutEditorialVisual = "inherit" | "none";
export type PublicSupplementaryBlockType =
  (typeof PUBLIC_SUPPLEMENTARY_BLOCK_TYPES)[number];
export type PublicSupplementaryBlockLayout =
  (typeof PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS)[number];

export type PublicSupplementaryBlockPresentation = {
  id: string;
  visible: boolean;
  layout: PublicSupplementaryBlockLayout;
};

export type AboutEditorialPageOverride = {
  title?: string;
  eyebrow?: string;
  introduction?: string;
};

export type AboutEditorialSectionCta = {
  label: string;
  href: string;
};

/** Presentation is intentionally separate from the copy fallback. */
export type PublicEditorialSectionPresentation = {
  sectionId: string;
  visible: boolean;
  visual: AboutEditorialVisual;
  layout?: AboutEditorialLayout;
};

/** Backward-compatible names used by the first About-only CMS batch. */
export type AboutEditorialSectionPresentation =
  PublicEditorialSectionPresentation & { sectionId: AboutEditorialSectionId };
export type AboutEditorialSectionOverride = {
  heading?: string;
  body?: string;
  content?: string;
  ctaLabel?: string;
  ctaHref?: string;
  editorial?: {
    sectionId: string;
    visible?: boolean;
  };
};
export type PublicEditorialSectionOverride = AboutEditorialSectionOverride;

const editorialSectionSets = new Map<string, Set<string>>(
  Object.entries(PUBLIC_EDITORIAL_SECTION_IDS).map(([slug, ids]) => [
    slug,
    new Set<string>(ids),
  ]),
);
const editorialSlugs = new Set<string>(PUBLIC_EDITORIAL_SLUGS);
const sectionIds = new Set<string>(
  Object.values(PUBLIC_EDITORIAL_SECTION_IDS).flat(),
);
const ctaSlugs = new Set<string>(PUBLIC_EDITORIAL_CTA_SLUGS);
const layouts = new Set<string>([
  "text-only",
  "media-left",
  "media-right",
  "wide-media",
]);
const supplementaryBlockTypes = new Set<string>(PUBLIC_SUPPLEMENTARY_BLOCK_TYPES);
const supplementaryBlockLayouts = new Set<string>(PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS);
const supplementaryBlockIdPattern = /^supplemental-[a-z0-9][a-z0-9-]{7,79}$/;

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function editorialLabel(slug: string) {
  return slug === ABOUT_EDITORIAL_SLUG ? "Hakkımızda" : `Public ${slug}`;
}

export function isPublicEditorialSlug(value: string): value is PublicEditorialSlug {
  return editorialSlugs.has(value);
}

export function getPublicEditorialSectionIds(
  slug: string,
): readonly string[] {
  return isPublicEditorialSlug(slug) ? PUBLIC_EDITORIAL_SECTION_IDS[slug] : [];
}

export function isPublicEditorialSectionId(slug: string, value: string) {
  return Boolean(editorialSectionSets.get(slug)?.has(value));
}

export function isAboutEditorialLocale(value: string): value is AboutEditorialLocale {
  return value === "tr" || value === "en";
}

export function isAboutEditorialSectionId(
  value: string,
): value is AboutEditorialSectionId {
  return isPublicEditorialSectionId(ABOUT_EDITORIAL_SLUG, value);
}

export function isPublicEditorialPage(
  locale: string,
  slug: string,
): slug is PublicEditorialSlug {
  return isAboutEditorialLocale(locale) && isPublicEditorialSlug(slug);
}

export function isAboutEditorialPage(locale: string, slug: string) {
  return isAboutEditorialLocale(locale) && slug === ABOUT_EDITORIAL_SLUG;
}

export function getPublicEditorialCtaHref(
  locale: AboutEditorialLocale,
  slug: PublicEditorialCtaSlug,
) {
  return `/${locale}/${slug}`;
}

export function getAboutEditorialCtaHref(
  locale: AboutEditorialLocale,
  slug: AboutEditorialCtaSlug,
) {
  return getPublicEditorialCtaHref(locale, slug);
}

export function getPublicEditorialCtaSlug(
  locale: string,
  href: string,
): PublicEditorialCtaSlug | undefined {
  if (!isAboutEditorialLocale(locale)) {
    return undefined;
  }

  const prefix = `/${locale}/`;
  if (!href.startsWith(prefix)) {
    return undefined;
  }

  const slug = href.slice(prefix.length);
  return ctaSlugs.has(slug) ? (slug as PublicEditorialCtaSlug) : undefined;
}

export function getAboutEditorialCtaSlug(
  locale: string,
  href: string,
): AboutEditorialCtaSlug | undefined {
  return getPublicEditorialCtaSlug(locale, href) as AboutEditorialCtaSlug | undefined;
}

export function normalizePublicEditorialSectionCta(
  locale: string,
  labelValue: unknown,
  hrefValue: unknown,
): AboutEditorialSectionCta | undefined {
  const label = optionalString(labelValue);
  const href = optionalString(hrefValue);
  if (!label || !href || !getPublicEditorialCtaSlug(locale, href)) {
    return undefined;
  }

  return { label, href };
}

export function normalizeAboutEditorialSectionCta(
  locale: string,
  labelValue: unknown,
  hrefValue: unknown,
) {
  return normalizePublicEditorialSectionCta(locale, labelValue, hrefValue);
}

export function normalizePublicEditorialPageOverride(
  value: unknown,
): AboutEditorialPageOverride | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const normalized = {
    title: optionalString(raw.title),
    eyebrow: optionalString(raw.eyebrow),
    introduction: optionalString(raw.introduction),
  };

  return normalized.title || normalized.eyebrow || normalized.introduction
    ? normalized
    : undefined;
}

export function normalizeAboutEditorialPageOverride(value: unknown) {
  return normalizePublicEditorialPageOverride(value);
}

export function normalizePublicEditorialPresentation(
  value: unknown,
  slug?: string,
): PublicEditorialSectionPresentation | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const sectionId = optionalString(raw.sectionId);
  if (
    !sectionId ||
    (slug
      ? !isPublicEditorialSectionId(slug, sectionId)
      : !sectionIds.has(sectionId))
  ) {
    return undefined;
  }

  const visual = raw.visual === "none" ? "none" : "inherit";
  const layout =
    typeof raw.layout === "string" && layouts.has(raw.layout)
      ? (raw.layout as AboutEditorialLayout)
      : undefined;

  return {
    sectionId,
    visible: typeof raw.visible === "boolean" ? raw.visible : true,
    visual,
    layout,
  };
}

export function normalizeAboutEditorialPresentation(
  value: unknown,
): AboutEditorialSectionPresentation | undefined {
  return normalizePublicEditorialPresentation(value, ABOUT_EDITORIAL_SLUG) as
    | AboutEditorialSectionPresentation
    | undefined;
}

export function normalizePublicSupplementaryBlockPresentation(
  value: unknown,
): PublicSupplementaryBlockPresentation | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const id = optionalString(raw.id)?.toLowerCase();
  if (!id || !supplementaryBlockIdPattern.test(id)) {
    return undefined;
  }

  const layout =
    typeof raw.layout === "string" && supplementaryBlockLayouts.has(raw.layout)
      ? (raw.layout as PublicSupplementaryBlockLayout)
      : "standard";

  return {
    id,
    visible: typeof raw.visible === "boolean" ? raw.visible : true,
    layout,
  };
}

export function validatePublicEditorialContract(input: {
  locale: string;
  slug: string;
  editorialPage: unknown;
  blocks: unknown[];
}) {
  const hasEditorialOverlay =
    input.editorialPage !== undefined ||
    input.blocks.some(
      (value) =>
        Boolean(
          value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            "editorial" in value,
        ),
    );

  // Existing non-editorial records remain valid. A curated page enters this
  // contract as soon as it stores an editorial overlay (or About, which has
  // always used the contract).
  if (!hasEditorialOverlay && input.slug !== ABOUT_EDITORIAL_SLUG) {
    return [];
  }

  const label = editorialLabel(input.slug);
  const errors: string[] = [];
  if (!isPublicEditorialPage(input.locale, input.slug)) {
    errors.push(`${label} editoryal içeriği canonical public slug ve locale kullanmalıdır.`);
    if (!isAboutEditorialLocale(input.locale)) {
      errors.push(`${label} editoryal içeriği yalnızca tr veya en locale kullanabilir.`);
    }
    return errors;
  }

  if (!isAboutEditorialLocale(input.locale)) {
    errors.push(`${label} editoryal içeriği yalnızca tr veya en locale kullanabilir.`);
  }

  if (
    input.editorialPage !== undefined &&
    (!input.editorialPage ||
      typeof input.editorialPage !== "object" ||
      Array.isArray(input.editorialPage))
  ) {
    errors.push(`${label} sayfa üst bilgisi geçerli bir nesne olmalıdır.`);
  } else if (input.editorialPage && typeof input.editorialPage === "object") {
    const page = input.editorialPage as Record<string, unknown>;
    for (const key of ["title", "eyebrow", "introduction"] as const) {
      if (page[key] !== undefined && typeof page[key] !== "string") {
        errors.push(`${label} ${key} değeri metin olmalıdır.`);
      }
    }
  }

  const allowedSectionIds = getPublicEditorialSectionIds(input.slug);
  const seen = new Set<string>();
  const seenSupplementaryIds = new Set<string>();
  let supplementaryCount = 0;
  let heroCount = 0;

  for (const value of input.blocks) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const raw = value as Record<string, unknown>;
    if (raw.editorial === undefined) {
      if (raw.type === "hero") {
        heroCount += 1;
        if (raw.cms !== undefined) {
          errors.push(`${label} hero bloğu ek CMS kimliği taşıyamaz.`);
        }
        continue;
      }

      const cms = normalizePublicSupplementaryBlockPresentation(raw.cms);
      const type = optionalString(raw.type);
      supplementaryCount += 1;

      if (!cms) {
        errors.push(`${label} ek bloğu geçerli ve sabit bir CMS kimliği taşımalıdır.`);
        continue;
      }
      const rawCms = raw.cms as Record<string, unknown>;
      if (rawCms.visible !== undefined && typeof rawCms.visible !== "boolean") {
        errors.push(`${cms.id}: görünürlük true veya false olmalıdır.`);
      }
      if (
        rawCms.layout !== undefined &&
        (typeof rawCms.layout !== "string" ||
          !supplementaryBlockLayouts.has(rawCms.layout))
      ) {
        errors.push(`${cms.id}: ek blok sunumu desteklenmiyor.`);
      }
      if (!type || !supplementaryBlockTypes.has(type)) {
        errors.push(`${cms.id}: bu ek blok türü desteklenmiyor.`);
      }
      if (seenSupplementaryIds.has(cms.id)) {
        errors.push(`Ek blok kimliği birden fazla kullanılamaz: ${cms.id}.`);
      }
      seenSupplementaryIds.add(cms.id);
      if (raw.media !== undefined) {
        errors.push(`${cms.id}: yönetilen medya değişimi henüz desteklenmiyor.`);
      }

      const ctaLabel = optionalString(raw.ctaLabel);
      const ctaHref = optionalString(raw.ctaHref);
      if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
        errors.push(`${cms.id}: CTA etiketi ve hedefi birlikte tanımlanmalıdır.`);
      }
      if (ctaLabel && ctaLabel.length > 80) {
        errors.push(`${cms.id}: CTA etiketi 80 karakterden uzun olamaz.`);
      }
      if (ctaHref && !getPublicEditorialCtaSlug(input.locale, ctaHref)) {
        errors.push(
          `${cms.id}: CTA hedefi yalnızca aynı dildeki onaylı public rotalardan biri olabilir.`,
        );
      }
      continue;
    }

    if (
      !raw.editorial ||
      typeof raw.editorial !== "object" ||
      Array.isArray(raw.editorial)
    ) {
      errors.push(`${label} bölüm sunumu geçerli bir nesne olmalıdır.`);
      continue;
    }

    const editorial = raw.editorial as Record<string, unknown>;
    const sectionId = optionalString(editorial.sectionId);
    if (!sectionId || !allowedSectionIds.includes(sectionId)) {
      errors.push(`Bilinmeyen ${label} bölüm kimliği: ${sectionId || "(boş)"}.`);
      continue;
    }

    if (seen.has(sectionId)) {
      errors.push(`${label} bölüm kimliği birden fazla kullanılamaz: ${sectionId}.`);
    }
    seen.add(sectionId);

    if (editorial.visible !== undefined && typeof editorial.visible !== "boolean") {
      errors.push(`${sectionId}: görünürlük true veya false olmalıdır.`);
    }

    if (
      editorial.visual !== undefined &&
      editorial.visual !== "inherit" &&
      editorial.visual !== "none"
    ) {
      errors.push(`${sectionId}: medya seçimi inherit veya none olmalıdır.`);
    }

    if (
      editorial.layout !== undefined &&
      (typeof editorial.layout !== "string" || !layouts.has(editorial.layout))
    ) {
      errors.push(`${sectionId}: sunum seçimi desteklenmiyor.`);
    }

    if (raw.type !== "text") {
      errors.push(`${sectionId}: editoryal bölüm text bloğu olmalıdır.`);
    }

    if (raw.media !== undefined) {
      errors.push(`${sectionId}: yönetilen medya değişimi bu batch içinde desteklenmiyor.`);
    }
    if (raw.cms !== undefined) {
      errors.push(`${sectionId}: ana bölüm aynı zamanda ek CMS bloğu olamaz.`);
    }

    if (raw.ctaLabel !== undefined && typeof raw.ctaLabel !== "string") {
      errors.push(`${sectionId}: CTA etiketi metin olmalıdır.`);
    }
    if (raw.ctaHref !== undefined && typeof raw.ctaHref !== "string") {
      errors.push(`${sectionId}: CTA hedefi metin olmalıdır.`);
    }

    const ctaLabel = optionalString(raw.ctaLabel);
    const ctaHref = optionalString(raw.ctaHref);
    if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
      errors.push(`${sectionId}: CTA etiketi ve hedefi birlikte tanımlanmalıdır.`);
    }
    if (ctaLabel && ctaLabel.length > 80) {
      errors.push(`${sectionId}: CTA etiketi 80 karakterden uzun olamaz.`);
    }
    if (ctaHref && !getPublicEditorialCtaSlug(input.locale, ctaHref)) {
      errors.push(
        `${sectionId}: CTA hedefi yalnızca aynı dildeki onaylı public rotalardan biri olabilir.`,
      );
    }
  }

  if (supplementaryCount > MAX_PUBLIC_SUPPLEMENTARY_BLOCKS) {
    errors.push(
      `${label} sayfasında en fazla ${MAX_PUBLIC_SUPPLEMENTARY_BLOCKS} ek blok kullanılabilir.`,
    );
  }
  if (heroCount > 1) {
    errors.push(`${label} sayfasında birden fazla hero bloğu kullanılamaz.`);
  }

  return errors;
}

export function validateAboutEditorialContract(input: {
  locale: string;
  slug: string;
  editorialPage: unknown;
  blocks: unknown[];
}) {
  return validatePublicEditorialContract(input);
}

export function mergePublicEditorialSections<
  T extends { id: string; heading: string; body: string; cta?: AboutEditorialSectionCta },
>(
  fallbackSections: readonly T[],
  overrides: readonly PublicEditorialSectionOverride[],
  slug: string,
  locale?: AboutEditorialLocale,
) {
  const firstById = new Map<string, PublicEditorialSectionOverride>();
  for (const override of overrides) {
    const sectionId = override.editorial?.sectionId;
    if (
      sectionId &&
      isPublicEditorialSectionId(slug, sectionId) &&
      !firstById.has(sectionId)
    ) {
      firstById.set(sectionId, override);
    }
  }

  const fallbackById = new Map(fallbackSections.map((section) => [section.id, section]));
  const orderedIds = [
    ...firstById.keys(),
    ...fallbackSections
      .map((section) => section.id)
      .filter((sectionId) => !firstById.has(sectionId)),
  ];

  return orderedIds.flatMap((sectionId) => {
    const baseline = fallbackById.get(sectionId);
    const override = firstById.get(sectionId);
    if (!baseline || override?.editorial?.visible === false) {
      return [];
    }

    const cta = locale
      ? normalizePublicEditorialSectionCta(
          locale,
          override?.ctaLabel,
          override?.ctaHref,
        )
      : undefined;

    return [
      {
        ...baseline,
        heading: override?.heading?.trim() || baseline.heading,
        body:
          override?.body?.trim() || override?.content?.trim() || baseline.body,
        cta: cta ?? baseline.cta,
      } as T,
    ];
  });
}

export function mergeAboutEditorialSections<
  T extends { id: string; heading: string; body: string; cta?: AboutEditorialSectionCta },
>(
  fallbackSections: readonly T[],
  overrides: readonly AboutEditorialSectionOverride[],
  locale?: AboutEditorialLocale,
) {
  return mergePublicEditorialSections(
    fallbackSections,
    overrides,
    ABOUT_EDITORIAL_SLUG,
    locale,
  );
}
